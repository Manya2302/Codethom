import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { MapPin, Loader2 } from 'lucide-react';

export default function MapRegistrationModal({ open, onClose, onSuccess, initialCoordinates }) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    pincode: '',
    locality: '',
    latitude: '',
    longitude: ''
  });
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    if (open) {
      checkRegistration();
      fetchUserData();
      
      // If initial coordinates are provided, use them; otherwise reset form
      if (initialCoordinates) {
        setFormData({
          address: '',
          pincode: '',
          locality: '',
          latitude: initialCoordinates.lat.toFixed(6),
          longitude: initialCoordinates.lng.toFixed(6)
        });
        fetchAddressFromCoordinates(initialCoordinates.lat, initialCoordinates.lng);
      } else {
        // Reset form when modal opens without coordinates
        setFormData({
          address: '',
          pincode: '',
          locality: '',
          latitude: '',
          longitude: ''
        });
      }
    }
  }, [open, initialCoordinates]);

  const checkRegistration = async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/map/check-registration', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setIsRegistered(data.registered);
        if (data.data) {
          setFormData({
            address: data.data.address || '',
            pincode: data.data.pincode || '',
            locality: data.data.locality || '',
            latitude: data.data.latitude?.toString() || '',
            longitude: data.data.longitude?.toString() || ''
          });
        }
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setChecking(false);
    }
  };

  const fetchUserData = async () => {
    // User data is already available from context
    // This is just to ensure we have the latest data
  };

  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      setFetchingAddress(true);
      const response = await fetch(`/api/map/reverse-geocode?lat=${lat}&lng=${lng}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            address: data.address || prev.address,
            pincode: data.pincode || prev.pincode,
            locality: data.locality || prev.locality
          }));
          toast({
            title: 'Address Retrieved',
            description: 'Address and pincode have been automatically filled from the selected location',
          });
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        // Try to get error message
        let errorMessage = 'Could not automatically fetch address. Please enter manually.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If not JSON, use default message
        }
        console.error('Reverse geocoding error:', errorMessage);
        toast({
          title: 'Warning',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast({
        title: 'Warning',
        description: 'Could not automatically fetch address. Please enter manually.',
        variant: 'destructive',
      });
    } finally {
      setFetchingAddress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.address || !formData.pincode || !formData.latitude || !formData.longitude) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/map/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: result.message || 'Successfully registered on map',
        });
        setIsRegistered(true);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to register on map',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error registering on map:', error);
      toast({
        title: 'Error',
        description: 'Failed to register on map. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFormData(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          }));
          await fetchAddressFromCoordinates(lat, lng);
        },
        (error) => {
          toast({
            title: 'Error',
            description: 'Failed to get your location. Please enter manually.',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
    }
  };

  if (checking) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
            <DialogDescription>Checking registration status</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isRegistered ? 'Update Map Registration' : 'Register Yourself on Map'}
          </DialogTitle>
          <DialogDescription>
            {isRegistered 
              ? 'Update your location information to appear on the map'
              : 'Add your location to appear on the map for other users to find you'
            }
          </DialogDescription>
        </DialogHeader>
        
        {user && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm"><strong>Name:</strong> {user.name}</p>
            <p className="text-sm"><strong>Email:</strong> {user.email}</p>
            <p className="text-sm"><strong>Role:</strong> {user.role}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={fetchingAddress ? "Fetching address..." : "Enter your full address or click on map"}
              required
              disabled={fetchingAddress}
            />
            {initialCoordinates && (
              <p className="text-xs text-muted-foreground mt-1">
                Address auto-filled from map click. You can edit if needed.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder={fetchingAddress ? "Fetching..." : "e.g., 380015"}
                required
                disabled={fetchingAddress}
              />
            </div>
            <div>
              <Label htmlFor="locality">Locality</Label>
              <Input
                id="locality"
                value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                placeholder={fetchingAddress ? "Fetching..." : "e.g., Navrangpura"}
                disabled={fetchingAddress}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => {
                  const lat = e.target.value;
                  setFormData({ ...formData, latitude: lat });
                  // If longitude is also set, fetch address
                  if (lat && formData.longitude) {
                    fetchAddressFromCoordinates(parseFloat(lat), parseFloat(formData.longitude));
                  }
                }}
                placeholder="e.g., 23.0225 or click on map"
                required
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => {
                  const lng = e.target.value;
                  setFormData({ ...formData, longitude: lng });
                  // If latitude is also set, fetch address
                  if (lng && formData.latitude) {
                    fetchAddressFromCoordinates(parseFloat(formData.latitude), parseFloat(lng));
                  }
                }}
                placeholder="e.g., 72.5714 or click on map"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGetCurrentLocation}
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Get Current Location
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Or click on the map to select a location
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isRegistered ? 'Updating...' : 'Registering...'}
                </>
              ) : (
                isRegistered ? 'Update Registration' : 'Register on Map'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

