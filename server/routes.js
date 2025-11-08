import { createServer } from "http";
import { Server } from "socket.io";
import { storage } from "./storage.js";
import authRoutes from "./auth-routes.js";
import { sendAccountApprovalEmail, sendAccountRejectionEmail } from "./email-service.js";

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Admin authorization middleware
const requireAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

// Super Admin authorization middleware
const requireSuperAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Super Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

export async function registerRoutes(app) {
  // Register auth routes
  app.use('/api', authRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // User routes (admin only)
  app.get('/api/users', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Users can only view their own profile unless they're admin
      if (req.session.userId !== req.params.id && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/users/:id', requireAdmin, async (req, res) => {
    try {
      const { role, status, name, phone, company } = req.body;
      const updates = {};
      if (role) updates.role = role;
      if (status) updates.status = status;
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (company) updates.company = company;

      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/users/:id', requireAdmin, async (req, res) => {
    try {
      const user = await storage.deleteUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/users/admin', requireAdmin, async (req, res) => {
    try {
      const { email, role } = req.body;

      if (!email || !role) {
        return res.status(400).json({ message: 'Email and role are required' });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found. User must sign up first.' });
      }

      const updatedUser = await storage.updateUser(existingUser._id, { role });
      res.json({ message: 'Admin role assigned successfully', user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Verification routes (admin only)
  app.get('/api/verifications', requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const filters = status ? { status } : {};
      const verifications = await storage.getAllVerifications(filters);
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/verifications/:id/approve', requireAdmin, async (req, res) => {
    try {
      const verification = await storage.getVerification(req.params.id);
      if (!verification) {
        return res.status(404).json({ message: 'Verification request not found' });
      }

      if (verification.status !== 'pending') {
        return res.status(400).json({ message: 'This verification has already been processed' });
      }

      // Check if email is already registered
      const existingUser = await storage.getUserByEmail(verification.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
      }

      // Create user account with verified status
      // Password is already hashed in verification, so skip hashing
      const user = await storage.createUser({
        name: verification.name,
        email: verification.email,
        password: verification.password,
        role: verification.role,
        reraId: verification.reraId,
        phone: verification.phone || '',
        company: verification.company || '',
        status: 'active',
        verified: true,
        isEmailVerified: true,
        isReraVerified: true,
      }, true);

      // Update verification status
      await storage.updateVerification(req.params.id, {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: req.session.userId,
      });

      // Send approval email
      await sendAccountApprovalEmail(
        verification.email,
        verification.name,
        verification.role,
        verification.reraId
      );

      res.json({
        message: 'Verification approved and user account created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          reraId: user.reraId,
        },
      });
    } catch (error) {
      console.error('Error approving verification:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/verifications/:id/reject', requireAdmin, async (req, res) => {
    try {
      const { reason } = req.body;
      
      if (!reason || reason.trim() === '') {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }

      const verification = await storage.getVerification(req.params.id);
      if (!verification) {
        return res.status(404).json({ message: 'Verification request not found' });
      }

      if (verification.status !== 'pending') {
        return res.status(400).json({ message: 'This verification has already been processed' });
      }

      // Update verification status
      await storage.updateVerification(req.params.id, {
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedBy: req.session.userId,
      });

      // Send rejection email
      await sendAccountRejectionEmail(
        verification.email,
        verification.name,
        verification.role,
        verification.reraId,
        reason
      );

      res.json({
        message: 'Verification rejected successfully',
      });
    } catch (error) {
      console.error('Error rejecting verification:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Document routes (authenticated users only)
  app.get('/api/documents/:userId', requireAuth, async (req, res) => {
    try {
      // Users can only view their own documents unless they're admin
      if (req.session.userId !== req.params.userId && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const documents = await storage.getDocumentsByUser(req.params.userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transaction routes (authenticated users only)
  app.get('/api/transactions/:userId', requireAuth, async (req, res) => {
    try {
      // Users can only view their own transactions unless they're admin
      if (req.session.userId !== req.params.userId && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const transactions = await storage.getTransactionsByUser(req.params.userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification routes (authenticated users only)
  app.get('/api/notifications/:userId', requireAuth, async (req, res) => {
    try {
      // Users can only view their own notifications unless they're admin
      if (req.session.userId !== req.params.userId && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const notifications = await storage.getNotificationsByUser(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
      // First get the notification to verify ownership
      const notification = await storage.getNotificationsByUser(req.session.userId);
      const targetNotification = notification.find(n => n._id.toString() === req.params.id);
      
      if (!targetNotification) {
        // Check if admin
        const user = await storage.getUser(req.session.userId);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Access denied. You can only mark your own notifications as read.' });
        }
      }
      
      const updatedNotification = await storage.markNotificationAsRead(req.params.id);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Super Admin routes (superadmin only)
  app.get('/api/superadmin/users/by-role', requireSuperAdmin, async (req, res) => {
    try {
      const { role } = req.query;
      const filters = role ? { role } : {};
      const users = await storage.getAllUsers(filters);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/superadmin/stats', requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status === 'active').length;
      
      // Count users by role
      const admins = users.filter(u => u.role === 'admin').length;
      const vendors = users.filter(u => u.role === 'vendor').length;
      const customers = users.filter(u => u.role === 'customer').length;
      const brokers = users.filter(u => u.role === 'broker').length;
      const investors = users.filter(u => u.role === 'investor').length;
      
      // Get all transactions to calculate revenue
      let totalRevenue = 0;
      for (const user of users) {
        const transactions = await storage.getTransactionsByUser(user._id);
        const userRevenue = transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        totalRevenue += userRevenue;
      }

      res.json({
        totalUsers,
        activeUsers,
        revenue: totalRevenue,
        growthRate: activeUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
        usersByRole: {
          admins,
          vendors,
          customers,
          brokers,
          investors
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/superadmin/create-admin', requireSuperAdmin, async (req, res) => {
    try {
      const { email, role } = req.body;

      if (!email || !role) {
        return res.status(400).json({ message: 'Email and role are required' });
      }

      const validAdminRoles = ['admin', 'superadmin'];
      if (!validAdminRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be admin or superadmin' });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found. User must sign up first.' });
      }

      const updatedUser = await storage.updateUser(existingUser._id, { role, status: 'active', verified: true });
      res.json({ message: `${role} role assigned successfully`, user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin stats route (admin only)
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status === 'active').length;
      
      // Get all transactions to calculate revenue
      let totalRevenue = 0;
      for (const user of users) {
        const transactions = await storage.getTransactionsByUser(user._id);
        const userRevenue = transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        totalRevenue += userRevenue;
      }

      res.json({
        totalUsers,
        activeUsers,
        revenue: totalRevenue,
        growthRate: activeUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Map registration routes
  // Check if user is registered in map
  app.get('/api/map/check-registration', requireAuth, async (req, res) => {
    try {
      const mapRegistration = await storage.getMapRegistrationByUser(req.session.userId);
      res.json({ registered: !!mapRegistration, data: mapRegistration });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Register user in map
  app.post('/api/map/register', requireAuth, async (req, res) => {
    try {
      const { address, pincode, locality, latitude, longitude } = req.body;

      if (!address || !pincode || !latitude || !longitude) {
        return res.status(400).json({ message: 'Address, pincode, latitude, and longitude are required' });
      }

      // Get user details
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create or update map registration
      const mapRegistration = await storage.createMapRegistration({
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address,
        pincode,
        locality: locality || '',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });

      res.json({ 
        message: 'Successfully registered on map',
        data: mapRegistration 
      });
    } catch (error) {
      console.error('Error registering user on map:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all map registrations (for displaying on map)
  app.get('/api/map/registrations', async (req, res) => {
    try {
      const { pincode } = req.query;
      let registrations;
      
      if (pincode) {
        registrations = await storage.getMapRegistrationsByPincode(pincode);
      } else {
        registrations = await storage.getAllMapRegistrations();
      }

      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get pincode boundary from Google Maps Geocoding API
  app.get('/api/map/pincode-boundary', async (req, res) => {
    try {
      const { pincode } = req.query;
      
      if (!pincode) {
        return res.status(400).json({ message: 'Pincode is required' });
      }

      // Import pincode data
      const { ahmedabadPincodes } = await import('../client/src/data/ahmedabadPincodes.js');
      
      // ALWAYS prioritize stored coordinates first (they have wavy, curved boundaries)
      const pincodeData = ahmedabadPincodes.find((p) => p.pincode === pincode);
      if (pincodeData && pincodeData.coordinates) {
        const boundary = pincodeData.coordinates.map(coord => ({
          lat: coord[0],
          lng: coord[1]
        }));
        return res.json({ 
          boundary, 
          source: 'stored',
          center: pincodeData.center ? { lat: pincodeData.center[0], lng: pincodeData.center[1] } : null
        });
      }

      // Only use Google Maps API if pincode not in stored list
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return res.status(404).json({ message: 'Pincode not found' });
      }

      // Use Google Maps Geocoding API as fallback
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pincode + ', Ahmedabad, Gujarat, India')}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        const geometry = result.geometry;
        
        let boundary = null;
        
        // Try to get viewport bounds first (most accurate)
        if (geometry.viewport) {
          const ne = geometry.viewport.northeast;
          const sw = geometry.viewport.southwest;
          
          // Create a rectangle boundary (simple fallback for pincodes not in stored list)
          boundary = [
            { lat: ne.lat, lng: sw.lng }, // Top-left
            { lat: ne.lat, lng: ne.lng }, // Top-right
            { lat: sw.lat, lng: ne.lng }, // Bottom-right
            { lat: sw.lat, lng: sw.lng }, // Bottom-left
            { lat: ne.lat, lng: sw.lng }, // Close polygon
          ];
        } else if (geometry.bounds) {
          // Use bounds if viewport not available
          const ne = geometry.bounds.northeast;
          const sw = geometry.bounds.southwest;
          
          boundary = [
            { lat: ne.lat, lng: sw.lng },
            { lat: ne.lat, lng: ne.lng },
            { lat: sw.lat, lng: ne.lng },
            { lat: sw.lat, lng: sw.lng },
            { lat: ne.lat, lng: sw.lng },
          ];
        } else if (geometry.location) {
          // Fallback: create approximate boundary around location
          const location = geometry.location;
          const radius = 0.015; // Approximate radius in degrees (~1.5km)
          
          boundary = [
            { lat: location.lat + radius, lng: location.lng - radius },
            { lat: location.lat + radius, lng: location.lng + radius },
            { lat: location.lat - radius, lng: location.lng + radius },
            { lat: location.lat - radius, lng: location.lng - radius },
            { lat: location.lat + radius, lng: location.lng - radius },
          ];
        }

        if (boundary) {
          return res.json({ 
            boundary, 
            source: 'google', 
            center: geometry.location || { lat: 0, lng: 0 }
          });
        }
      } else {
        // Log Google Maps API errors for debugging
        console.error('Google Maps Geocoding API error:', data.status, data.error_message || 'Unknown error');
      }

      return res.status(404).json({ message: 'Pincode not found' });
    } catch (error) {
      console.error('Error fetching pincode boundary:', error);
      res.status(500).json({ message: 'Failed to fetch pincode boundary', error: error.message });
    }
  });

  // Reverse geocoding - get address and pincode from coordinates
  app.get('/api/map/reverse-geocode', async (req, res) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      // Validate coordinates
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      // Use Google Maps Geocoding API if available, otherwise fallback to Nominatim
      if (process.env.GOOGLE_MAPS_API_KEY) {
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
          const response = await fetch(geocodeUrl);
          const data = await response.json();

          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];
            const address = result.formatted_address || '';
            
            // Extract address components
            const addressComponents = result.address_components || [];
            let pincode = '';
            let locality = '';
            let city = '';
            
            addressComponents.forEach(component => {
              const types = component.types || [];
              if (types.includes('postal_code')) {
                pincode = component.long_name;
              }
              if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
                locality = component.long_name;
              }
              if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                if (!locality) locality = component.long_name;
                city = component.long_name;
              }
            });

            return res.json({
              address,
              pincode,
              locality: locality || city,
              city
            });
          } else {
            console.error('Google Geocoding API error:', data.status, data.error_message);
            // Fallback to Nominatim
          }
        } catch (googleError) {
          console.error('Google Geocoding API error:', googleError);
          // Fallback to Nominatim
        }
      }

      // Fallback to Nominatim (OpenStreetMap) reverse geocoding API
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
          {
            headers: {
              'User-Agent': 'TerriSmart/1.0 (contact@terrismart.com)',
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          }
        );

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (data && !data.error) {
              const address = data.display_name || '';
              const addressParts = data.address || {};
              const pincode = addressParts.postcode || '';
              const locality = addressParts.suburb || addressParts.neighbourhood || addressParts.city_district || '';
              const city = addressParts.city || addressParts.town || addressParts.village || '';

              return res.json({
                address,
                pincode,
                locality: locality || city,
                city
              });
            }
          }
        }
      } catch (nominatimError) {
        console.error('Nominatim error:', nominatimError);
      }

      // If both fail, return error
      return res.status(500).json({ 
        message: 'Could not find address for these coordinates. Please enter manually.' 
      });
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      res.status(500).json({ 
        message: 'Failed to get address from coordinates. Please enter manually.',
        error: error.message 
      });
    }
  });

  // Admin analytics route (admin only) - returns detailed analytics data
  app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // User distribution by role
      const userDistribution = {
        customer: users.filter(u => u.role === 'customer').length,
        vendor: users.filter(u => u.role === 'vendor').length,
        broker: users.filter(u => u.role === 'broker').length,
        investor: users.filter(u => u.role === 'investor').length,
        admin: users.filter(u => u.role === 'admin').length,
      };

      // User growth over time (last 12 months)
      const now = new Date();
      const userGrowth = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const usersInMonth = users.filter(u => {
          const userDate = u.createdAt ? new Date(u.createdAt) : new Date();
          return userDate >= monthStart && userDate <= monthEnd;
        }).length;
        
        userGrowth.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          users: usersInMonth,
          cumulative: users.filter(u => {
            const userDate = u.createdAt ? new Date(u.createdAt) : new Date();
            return userDate <= monthEnd;
          }).length
        });
      }

      // Revenue trends (last 12 months)
      const revenueTrends = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        let monthRevenue = 0;
        for (const user of users) {
          const transactions = await storage.getTransactionsByUser(user._id);
          const userMonthRevenue = transactions
            .filter(t => {
              const transDate = t.createdAt ? new Date(t.createdAt) : new Date();
              return t.status === 'completed' && transDate >= monthStart && transDate <= monthEnd;
            })
            .reduce((sum, t) => sum + t.amount, 0);
          monthRevenue += userMonthRevenue;
        }
        
        revenueTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue
        });
      }

      // Activity trends (users by status)
      const activityTrends = {
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        pending: users.filter(u => u.status === 'pending').length,
        verified: users.filter(u => u.verified || u.isEmailVerified).length,
        unverified: users.filter(u => !u.verified && !u.isEmailVerified).length,
      };

      res.json({
        userDistribution,
        userGrowth,
        revenueTrends,
        activityTrends
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get Google Maps configuration (without exposing API key)
  app.get('/api/maps/config', (req, res) => {
    res.json({
      enabled: !!process.env.GOOGLE_MAPS_API_KEY,
      apiKey: process.env.GOOGLE_MAPS_API_KEY || ''
    });
  });

  // Fetch Places (POI) data for a pincode or location
  app.get('/api/maps/places', async (req, res) => {
    try {
      const { pincode, lat, lng, radius = 5000, type } = req.query;
      
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return res.status(503).json({ message: 'Google Maps API not configured' });
      }

      let location;
      
      // If pincode provided, geocode it first
      if (pincode) {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pincode + ', Ahmedabad, Gujarat, India')}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
          location = geocodeData.results[0].geometry.location;
        } else {
          return res.status(404).json({ message: 'Pincode not found' });
        }
      } else if (lat && lng) {
        location = { lat: parseFloat(lat), lng: parseFloat(lng) };
      } else {
        return res.status(400).json({ message: 'Either pincode or lat/lng is required' });
      }

      // Define POI categories relevant to real estate
      const categories = [
        'hospital',
        'school',
        'restaurant', 
        'shopping_mall',
        'park',
        'bus_station',
        'train_station',
        'gym',
        'bank',
        'police',
        'fire_station',
        'pharmacy',
        'supermarket',
        'cafe',
        'movie_theater'
      ];

      const categoryToSearch = type || categories;
      const placesData = {};

      // If specific type requested, search only that
      if (type && typeof type === 'string') {
        const searchTypes = Array.isArray(categoryToSearch) ? categoryToSearch : [categoryToSearch];
        
        for (const placeType of searchTypes) {
          const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${placeType}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
          
          const placesResponse = await fetch(placesUrl);
          const placesResult = await placesResponse.json();
          
          if (placesResult.status === 'OK') {
            placesData[placeType] = placesResult.results.map(place => ({
              name: place.name,
              vicinity: place.vicinity,
              location: place.geometry.location,
              placeId: place.place_id,
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              types: place.types,
              businessStatus: place.business_status
            }));
          } else {
            placesData[placeType] = [];
          }
        }
      } else {
        // Search all categories
        for (const category of categories) {
          const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${category}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
          
          const placesResponse = await fetch(placesUrl);
          const placesResult = await placesResponse.json();
          
          if (placesResult.status === 'OK') {
            placesData[category] = placesResult.results.map(place => ({
              name: place.name,
              vicinity: place.vicinity,
              location: place.geometry.location,
              placeId: place.place_id,
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              types: place.types,
              businessStatus: place.business_status
            }));
          } else {
            placesData[category] = [];
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      res.json({
        location,
        radius: parseInt(radius),
        data: placesData
      });
    } catch (error) {
      console.error('Error fetching places:', error);
      res.status(500).json({ message: 'Failed to fetch places data', error: error.message });
    }
  });

  // Get aggregated POI counts for a pincode
  app.get('/api/maps/poi-summary', async (req, res) => {
    try {
      const { pincode, lat, lng, radius = 5000 } = req.query;
      
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return res.status(503).json({ message: 'Google Maps API not configured' });
      }

      let location;
      
      // If pincode provided, geocode it first
      if (pincode) {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pincode + ', Ahmedabad, Gujarat, India')}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
          location = geocodeData.results[0].geometry.location;
        } else {
          return res.status(404).json({ message: 'Pincode not found' });
        }
      } else if (lat && lng) {
        location = { lat: parseFloat(lat), lng: parseFloat(lng) };
      } else {
        return res.status(400).json({ message: 'Either pincode or lat/lng is required' });
      }

      // Define POI categories with display names and icons
      const categories = [
        { type: 'hospital', label: 'Hospitals', icon: '🏥' },
        { type: 'school', label: 'Schools', icon: '🏫' },
        { type: 'restaurant', label: 'Restaurants', icon: '🍽️' },
        { type: 'shopping_mall', label: 'Shopping Malls', icon: '🛒' },
        { type: 'park', label: 'Parks', icon: '🌳' },
        { type: 'bus_station', label: 'Bus Stations', icon: '🚌' },
        { type: 'train_station', label: 'Train Stations', icon: '🚆' },
        { type: 'gym', label: 'Gyms', icon: '💪' },
        { type: 'bank', label: 'Banks', icon: '🏦' },
        { type: 'pharmacy', label: 'Pharmacies', icon: '💊' },
        { type: 'supermarket', label: 'Supermarkets', icon: '🛍️' },
        { type: 'cafe', label: 'Cafes', icon: '☕' },
      ];

      const summary = [];

      for (const category of categories) {
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${category.type}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        
        const placesResponse = await fetch(placesUrl);
        const placesResult = await placesResponse.json();
        
        if (placesResult.status === 'OK') {
          summary.push({
            type: category.type,
            label: category.label,
            icon: category.icon,
            count: placesResult.results.length,
            places: placesResult.results.slice(0, 5).map(place => ({
              name: place.name,
              vicinity: place.vicinity,
              location: place.geometry.location,
              placeId: place.place_id,
              rating: place.rating
            }))
          });
        } else {
          summary.push({
            type: category.type,
            label: category.label,
            icon: category.icon,
            count: 0,
            places: []
          });
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      res.json({
        location,
        radius: parseInt(radius),
        summary
      });
    } catch (error) {
      console.error('Error fetching POI summary:', error);
      res.status(500).json({ message: 'Failed to fetch POI summary', error: error.message });
    }
  });

  const httpServer = createServer(app);

  // Setup Socket.IO for real-time notifications
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Make io available to other parts of the app
  app.set('io', io);

  return httpServer;
}
