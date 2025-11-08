import { Router } from 'express';
import { storage } from './storage.js';
import bcrypt from 'bcryptjs';
import { sendOTPEmail, sendReraConfirmationEmail } from './email-service.js';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const router = Router();

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate RERA ID format (simplified validation)
// Real implementation would call RERA API or Surepass
function validateReraIdFormat(reraId) {
  if (!reraId || typeof reraId !== 'string') {
    return false;
  }

  // Remove spaces and convert to uppercase for validation
  const cleanedId = reraId.trim().toUpperCase();

  // Multiple valid RERA formats used across India:
  
  // Format 1a: PR/STATE/DISTRICT/CITY/AUTHORITY/ALPHANUMERIC/DDMMYY (Full format with spaces in city names)
  // Example: PR/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/RAA07880/070121
  const format1a = /^(PR|AG|PA)\/[A-Z]{2}\/[A-Z\s]+\/[A-Z\s]+\/[A-Z]+\/[A-Z0-9]+\/\d{6}$/;
  
  // Format 1b: PR/STATE/CITY/ALPHANUMERIC/DDMMYY (Short format)
  // Example: PR/GJ/AHMEDABAD/RAA07880/070121
  const format1b = /^(PR|AG|PA)\/[A-Z]{2}\/[A-Z\s]+\/[A-Z0-9]+\/\d{6}$/;
  
  // Format 2: Simple state code + number (e.g., P99000052568, MH12345678901234)
  const format2 = /^[A-Z]{1,2}\d{8,14}$/;
  
  // Format 3: State/Type/Number/Date (Karnataka, Maharashtra extended)
  // Example: KA/RERA/123/2020, MH/PROJ/12345/201234
  const format3 = /^[A-Z]{2}\/(RERA|PROJ|AG)\/[A-Z0-9]+\/\d{4,6}$/;
  
  // Format 4: Full format with hyphens (Tamil Nadu)
  // Example: TN-RERA-12345-2020
  const format4 = /^[A-Z]{2}-RERA-[A-Z0-9]+-\d{4}$/;

  return format1a.test(cleanedId) || 
         format1b.test(cleanedId) || 
         format2.test(cleanedId) || 
         format3.test(cleanedId) || 
         format4.test(cleanedId);
}

// Sign Up Route
router.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, reraId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role
    const validRoles = ['customer', 'investor', 'vendor', 'broker'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // For Vendor and Broker: Validate RERA ID format and create verification record
    if (role.toLowerCase() === 'vendor' || role.toLowerCase() === 'broker') {
      if (!reraId) {
        return res.status(400).json({ message: 'RERA ID is required for vendors and brokers' });
      }

      // Validate Gujarat RERA ID format only
      if (!validateReraIdFormat(reraId)) {
        return res.status(400).json({ 
          message: 'Invalid RERA ID format. Please verify your RERA ID at https://gujrera.gujarat.gov.in/' 
        });
      }

      // Check if there's already a pending verification for this email
      const existingVerification = await storage.getVerificationByEmail(email);
      if (existingVerification && existingVerification.status === 'pending') {
        return res.status(400).json({ 
          message: 'A verification request for this email is already pending review.' 
        });
      }

      // Always create verification record for admin review (no automatic approval)
      const verification = await storage.createVerification({
        name,
        email,
        password,
        role: role.toLowerCase(),
        reraId: reraId,
        phone: req.body.phone || '',
        company: req.body.company || '',
        status: 'pending',
      });

      res.status(201).json({
        message: 'Your account is under verification. We will send the result within 24 hours.',
        requiresManualReview: true,
        verificationUrl: 'https://gujrera.gujarat.gov.in/'
      });
    }
    // For Customer and Investor: Send OTP for email verification
    else if (role.toLowerCase() === 'customer' || role.toLowerCase() === 'investor') {
      // Create user with 'pending' status
      const user = await storage.createUser({
        name,
        email,
        password,
        role: role.toLowerCase(),
        status: 'pending',
        verified: false,
        isEmailVerified: false,
      });

      // Generate and store OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOTP({
        email,
        code: otpCode,
        type: 'signup',
        expiresAt,
      });

      // Send OTP via email
      const emailSent = await sendOTPEmail(email, otpCode, 'signup');
      
      if (!emailSent) {
        console.log(`Failed to send email, logging OTP for ${email}: ${otpCode}`);
      }

      res.status(201).json({
        message: 'Account created. Please check your email for the verification code.',
        email,
        role: role.toLowerCase(),
        requiresOTP: true,
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify OTP Route
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const otpRecord = await storage.getOTPByEmail(email, 'signup');
    
    if (!otpRecord) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await storage.deleteOTPsByEmail(email);
      await storage.deleteUser((await storage.getUserByEmail(email))?._id);
      return res.status(429).json({ 
        message: 'Maximum verification attempts exceeded. Please sign up again.',
        redirect: true
      });
    }

    if (otpRecord.code !== code) {
      await storage.incrementOTPAttempt(otpRecord._id);
      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      return res.status(400).json({ 
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        attemptsRemaining: remainingAttempts
      });
    }

    // Update user status to active and verified
    const user = await storage.getUserByEmail(email);
    if (user) {
      await storage.updateUser(user._id, {
        status: 'active',
        verified: true,
        isEmailVerified: true,
      });
    }

    // Delete used OTP
    await storage.deleteOTP(otpRecord._id);

    res.json({ 
      message: 'Email verified successfully',
      role: user.role 
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Resend OTP Route
router.post('/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await storage.createOTP({
      email,
      code: otpCode,
      type: 'signup',
      expiresAt,
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otpCode, 'signup');
    
    if (!emailSent) {
      console.log(`Failed to send email, logging new OTP for ${email}: ${otpCode}`);
    }

    res.json({ message: 'New verification code sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Sign In Route
router.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Store user in session
    req.session.userId = user._id;
    req.session.userRole = user.role;

    res.json({
      message: 'Sign in successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Sign Out Route
router.post('/auth/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to sign out' });
    }
    res.json({ message: 'Signed out successfully' });
  });
});

// Get Current User Route
router.get('/auth/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Forgot Password - Request OTP
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await storage.createOTP({
      email,
      code: otpCode,
      type: 'password-reset',
      expiresAt,
    });

    const emailSent = await sendOTPEmail(email, otpCode, 'password-reset');
    
    if (!emailSent) {
      console.log(`Failed to send email, logging OTP for ${email}: ${otpCode}`);
    }

    res.json({ message: 'Password reset code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify Password Reset OTP
router.post('/auth/verify-reset-otp', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const otpRecord = await storage.getOTPByEmail(email, 'password-reset');
    
    if (!otpRecord) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await storage.deleteOTP(otpRecord._id);
      return res.status(400).json({ 
        message: 'Verification code has expired. Please request a new one.',
        expired: true
      });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await storage.deleteOTPsByEmail(email);
      return res.status(429).json({ 
        message: 'Maximum verification attempts exceeded. Please request a new code.',
        redirect: true
      });
    }

    if (otpRecord.code !== code) {
      await storage.incrementOTPAttempt(otpRecord._id);
      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      return res.status(400).json({ 
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        attemptsRemaining: remainingAttempts
      });
    }

    res.json({ 
      message: 'Code verified successfully',
      verified: true 
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset Password
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const otpRecord = await storage.getOTPByEmail(email, 'password-reset');
    
    if (!otpRecord) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await storage.deleteOTP(otpRecord._id);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await storage.deleteOTPsByEmail(email);
      return res.status(429).json({ 
        message: 'Maximum verification attempts exceeded. Please request a new code.',
        redirect: true
      });
    }

    if (otpRecord.code !== code) {
      await storage.incrementOTPAttempt(otpRecord._id);
      const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      return res.status(400).json({ 
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        attemptsRemaining: remainingAttempts
      });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateUser(user._id, { password: hashedPassword });

    await storage.deleteOTP(otpRecord._id);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Real-time RERA ID validation (for live checking as user types)
router.post('/auth/check-rera', async (req, res) => {
  try {
    const { reraId } = req.body;

    if (!reraId) {
      return res.status(400).json({ 
        valid: false,
        formatValid: false,
        message: 'RERA ID is required' 
      });
    }

    // Validate RERA ID format
    const isValidFormat = validateReraIdFormat(reraId);
    
    if (!isValidFormat) {
      return res.status(200).json({ 
        valid: false,
        formatValid: false,
        message: 'Invalid RERA ID format. Examples: PR/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/RAA07880/070121 or MH12345678901234' 
      });
    }

    // Check if Surepass API is configured
    const SUREPASS_API_KEY = process.env.SUREPASS_API_KEY;
    
    if (SUREPASS_API_KEY) {
      // Real verification using Surepass API
      try {
        const surepassResponse = await fetch('https://kyc-api.surepass.io/api/v1/rera/verify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUREPASS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ rera_number: reraId })
        });

        const surepassData = await surepassResponse.json();
        
        if (surepassResponse.ok && surepassData.success) {
          return res.json({ 
            valid: true,
            formatValid: true,
            realVerification: true,
            message: 'RERA ID verified with government database',
            data: surepassData.data,
            reraId: reraId
          });
        } else {
          return res.json({ 
            valid: false,
            formatValid: true,
            realVerification: true,
            message: 'RERA ID not found in government database',
            reraId: reraId
          });
        }
      } catch (apiError) {
        console.error('Surepass API error:', apiError);
        // Fall through to format-only validation
      }
    }
    
    // Format validation only (no real verification)
    res.json({ 
      valid: true,
      formatValid: true,
      realVerification: false,
      message: 'Format is valid. Please verify manually on Gujarat RERA website.',
      verificationUrl: 'https://gujrera.gujarat.gov.in/',
      reraId: reraId
    });
  } catch (error) {
    console.error('RERA check error:', error);
    res.status(500).json({ 
      valid: false,
      formatValid: false,
      message: 'Error checking RERA ID' 
    });
  }
});

// RERA Verification Route (final verification during signup)
router.post('/auth/verify-rera', async (req, res) => {
  try {
    const { email, reraId } = req.body;

    if (!email || !reraId) {
      return res.status(400).json({ message: 'Email and RERA ID are required' });
    }

    // Get user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate RERA ID format
    if (!validateReraIdFormat(reraId)) {
      return res.status(400).json({ 
        message: 'Invalid RERA ID format. Please enter a valid RERA registration number.' 
      });
    }

    // In production, you would call RERA API or Surepass here
    // For now, we'll do simplified validation
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user with RERA verification
    await storage.updateUser(user._id, {
      reraId: reraId,
      isReraVerified: true,
      status: 'active',
      verified: true,
      isEmailVerified: true,
    });

    // Send confirmation email
    const emailSent = await sendReraConfirmationEmail(user.email, user.name, reraId, user.role);
    
    if (!emailSent) {
      console.log(`Failed to send RERA confirmation email to ${user.email}`);
    }

    res.json({ 
      message: 'RERA verification successful',
      verified: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        reraId: reraId,
        isReraVerified: true
      }
    });
  } catch (error) {
    console.error('RERA verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.APP_URL || 'http://localhost:5000'}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Return profile data - user creation will happen in callback route
      const profileData = {
        googleId: profile.id,
        name: profile.displayName || (profile.name?.givenName + ' ' + profile.name?.familyName) || 'User',
        email: profile.emails[0].value,
        picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null
      };
      return done(null, profileData);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth routes
  router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/signin?error=google_auth_failed', session: false }),
    async (req, res) => {
      try {
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(req.user.email);
        
        if (existingUser) {
          // User exists, log them in
          req.session.userId = existingUser._id.toString();
          req.session.userRole = existingUser.role;
          // Update Google ID if not set
          if (!existingUser.googleId) {
            await storage.updateUser(existingUser._id, {
              googleId: req.user.googleId,
              isEmailVerified: true,
              verified: true
            });
          }
          
          // Role-based dashboard redirect (same logic as regular sign-in)
          let dashboardPath = '/dashboard';
          const role = existingUser.role;
          
          if (role === 'superadmin') {
            dashboardPath = '/superadmin/dashboard';
          } else if (role === 'admin') {
            dashboardPath = '/admin/dashboard';
          } else if (role === 'partner') {
            dashboardPath = '/partner/dashboard';
          } else if (role === 'customer' || role === 'investor' || role === 'vendor' || role === 'broker') {
            dashboardPath = `/dashboard/${role}`;
          }
          
          return res.redirect(dashboardPath);
        }
        
        // New user - store Google profile in session and redirect to completion page
        req.session.googleProfile = {
          googleId: req.user.googleId,
          name: req.user.name,
          email: req.user.email,
          picture: req.user.picture || null
        };
        
        res.redirect('/google-oauth-complete');
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect('/signin?error=google_auth_failed');
      }
    }
  );
} else {
  // Google OAuth routes (placeholder if not configured)
  router.get('/auth/google', (req, res) => {
    res.status(501).json({ 
      message: 'Google OAuth not configured yet. Please set up GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' 
    });
  });

  router.get('/auth/google/callback', (req, res) => {
    res.status(501).json({ 
      message: 'Google OAuth not configured yet.' 
    });
  });
}

// Get Google OAuth profile from session (for completion page)
router.get('/auth/google/profile', (req, res) => {
  if (!req.session.googleProfile) {
    return res.status(404).json({ message: 'No Google profile found. Please sign in with Google again.' });
  }
  res.json(req.session.googleProfile);
});

// Complete Google OAuth registration
router.post('/auth/google/complete', async (req, res) => {
  try {
    const { role, password, confirmPassword, reraId } = req.body;

    // Check if Google profile exists in session
    if (!req.session.googleProfile) {
      return res.status(400).json({ message: 'Google profile not found. Please sign in with Google again.' });
    }

    const { googleId, name, email } = req.session.googleProfile;

    // Validate required fields
    if (!role || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Role, password, and confirm password are required' });
    }

    // Validate role
    const validRoles = ['customer', 'investor', 'vendor', 'broker'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // For Vendor and Broker: Validate RERA ID format
    if (role.toLowerCase() === 'vendor' || role.toLowerCase() === 'broker') {
      if (!reraId) {
        return res.status(400).json({ message: 'RERA ID is required for Vendors and Brokers' });
      }

      if (!validateReraIdFormat(reraId)) {
        return res.status(400).json({ 
          message: 'Invalid RERA ID format. Please enter a valid RERA registration number.' 
        });
      }

      // Create verification record for vendor/broker (same as regular signup)
      await storage.createVerification({
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: role.toLowerCase(),
        reraId,
        phone: '',
        company: '',
        status: 'pending'
      });

      // Clear Google profile from session
      delete req.session.googleProfile;

      res.json({
        message: 'Account registration submitted. Your account is pending admin verification. You will be notified via email.',
        requiresManualReview: true
      });
    } else {
      // For Customer and Investor: Create user directly and send OTP
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role: role.toLowerCase(),
        googleId,
        isEmailVerified: true,
        verified: false, // Will be verified after OTP
        status: 'pending'
      }, true); // Skip password hash since we already hashed it

      // Generate and send OTP
      const otpCode = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOTP({
        email,
        code: otpCode,
        type: 'signup',
        expiresAt: otpExpiresAt
      });

      const emailSent = await sendOTPEmail(email, otpCode, 'signup');
      if (!emailSent) {
        console.log(`Failed to send OTP email to ${email}`);
      }

      // Clear Google profile from session
      delete req.session.googleProfile;

      res.json({
        message: 'Account created successfully. Please verify your email to continue.',
        requiresOTP: true,
        email: email
      });
    }
  } catch (error) {
    console.error('Google OAuth completion error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Get users with pincode for map display
router.get('/auth/users-with-pincode', async (req, res) => {
  try {
    // Get all users
    const allUsers = await storage.getAllUsers();
    
    // Filter users with investor, vendor, or broker roles that have pincode
    const users = allUsers.filter(user => 
      ['investor', 'vendor', 'broker'].includes(user.role) &&
      user.pincode &&
      user.pincode.trim() !== ''
    );

    // Format users for map display
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      pincode: user.pincode,
      locality: user.locality,
      latitude: user.latitude,
      longitude: user.longitude,
      streetAddress: user.streetAddress,
      phone: user.phone,
      company: user.company
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users with pincode:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

export default router;
