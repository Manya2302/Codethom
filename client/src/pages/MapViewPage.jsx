import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import MapView from '@/components/MapView';
import MapRegistrationModal from '@/components/MapRegistrationModal';
import { Button } from '@/components/ui/button';

export default function MapViewPage() {
  const [location, setLocation] = useLocation();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checking, setChecking] = useState(true);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

  useEffect(() => {
    // Check if register query parameter is present
    const params = new URLSearchParams(window.location.search);
    if (params.get('register') === 'true') {
      setShowRegistrationModal(true);
      // Remove query parameter from URL
      setLocation('/map');
    }
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/map/check-registration', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setIsRegistered(data.registered);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleRegistrationSuccess = () => {
    setIsRegistered(true);
    checkRegistrationStatus();
  };

  return (
    <DashboardLayout role="user">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Territory Map</h1>
            <p className="text-muted-foreground">Search by pincode to view vendors, investors, and brokers in the area.</p>
          </div>
          {!checking && !isRegistered && (
            <Button
              onClick={() => {
                setSelectedCoordinates(null);
                setShowRegistrationModal(true);
              }}
              className="flex items-center gap-2"
            >
              <span>Register Yourself on Map</span>
            </Button>
          )}
        </div>
        <MapView 
          onMapClick={(coords) => {
            setSelectedCoordinates(coords);
            setShowRegistrationModal(true);
          }} 
        />
      </div>
      <MapRegistrationModal
        open={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setSelectedCoordinates(null);
        }}
        onSuccess={handleRegistrationSuccess}
        initialCoordinates={selectedCoordinates}
      />
    </DashboardLayout>
  );
}

