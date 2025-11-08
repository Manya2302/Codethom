import React, { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow, Polygon, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { ahmedabadPincodes } from "../data/ahmedabadPincodes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Google Maps container style
const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

// Default center (Ahmedabad)
const defaultCenter = {
  lat: 23.0225,
  lng: 72.5714,
};

// Libraries for Google Maps - defined outside component to prevent re-renders
const libraries = ["places", "drawing", "geometry"];

// Marker icons based on role
const getMarkerIcon = (role) => {
  const baseIcon = "https://cdn-icons-png.flaticon.com/512/684/684908.png";
  
  // Return different colored markers based on role
  if (role === 'investor') {
    return {
      url: baseIcon,
      scaledSize: { width: 32, height: 32 },
      fillColor: '#dc2626',
      fillOpacity: 1,
    };
  } else if (role === 'vendor') {
    return {
      url: baseIcon,
      scaledSize: { width: 32, height: 32 },
      fillColor: '#2563eb',
      fillOpacity: 1,
    };
  } else if (role === 'broker') {
    return {
      url: baseIcon,
      scaledSize: { width: 32, height: 32 },
      fillColor: '#eab308',
      fillOpacity: 1,
    };
  }
  
  return {
    url: baseIcon,
    scaledSize: { width: 32, height: 32 },
  };
};

export default function MapView({ selectedPincode: externalSelectedPincode, onPincodeSelect, onMapClick }) {
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(12);
  const [users, setUsers] = useState([]);
  const [searchPincode, setSearchPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [internalSelectedPincode, setInternalSelectedPincode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pincodeBoundary, setPincodeBoundary] = useState(null);
  const mapRef = useRef(null);
  
  // Use external selectedPincode if provided, otherwise use internal state
  const selectedPincode = externalSelectedPincode !== undefined ? externalSelectedPincode : internalSelectedPincode;

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', // You'll need to add this to .env
    libraries: libraries,
  });


  // Fetch pincode boundary from server API (prioritizes stored wavy coordinates)
  const fetchPincodeBoundary = useCallback(async (pincode) => {
    // Always check stored coordinates first (they have wavy, curved boundaries)
    const pincodeData = ahmedabadPincodes.find((p) => p.pincode === pincode);
    if (pincodeData && pincodeData.coordinates) {
      // Use stored wavy coordinates directly
      return pincodeData.coordinates.map(coord => ({
        lat: coord[0],
        lng: coord[1]
      }));
    }
    
    // If not in stored list, try server API (which will use Google Maps as fallback)
    try {
      const response = await fetch(`/api/map/pincode-boundary?pincode=${pincode}`);
      if (response.ok) {
        const data = await response.json();
        return data.boundary;
      }
      return null;
    } catch (error) {
      console.error('Error fetching pincode boundary:', error);
      return null;
    }
  }, []);

  // Fetch map registrations
  useEffect(() => {
    fetchMapRegistrations();
  }, [selectedPincode]);

  const fetchMapRegistrations = async () => {
    try {
      setLoading(true);
      const url = selectedPincode 
        ? `/api/map/registrations?pincode=${selectedPincode}`
        : '/api/map/registrations';
      
      const response = await fetch(url);
      if (response.ok) {
        const mapData = await response.json();
        const usersWithLocation = mapData
          .filter(registration => registration.latitude && registration.longitude)
          .map(registration => ({
            _id: registration._id,
            name: registration.name,
            email: registration.email,
            role: registration.role,
            pincode: registration.pincode,
            locality: registration.locality,
            latitude: registration.latitude,
            longitude: registration.longitude,
            streetAddress: registration.address,
            address: registration.address
          }));
        setUsers(usersWithLocation);
      }
    } catch (error) {
      console.error('Failed to fetch map registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle pincode search
  const handleSearch = async () => {
    if (searchPincode.trim()) {
      const pincode = searchPincode.trim();
      const pincodeData = ahmedabadPincodes.find((p) => p.pincode === pincode);
      
      if (pincodeData) {
        // Set the selected pincode
        if (onPincodeSelect) {
          onPincodeSelect(pincode);
        } else {
          setInternalSelectedPincode(pincode);
        }
        
        // Update map center
        setMapCenter({
          lat: pincodeData.center[0],
          lng: pincodeData.center[1]
        });
        setMapZoom(14);
        
        // Fetch boundary from server API
        try {
          const boundary = await fetchPincodeBoundary(pincode);
          if (boundary) {
            setPincodeBoundary(boundary);
          } else {
            // Fallback to stored coordinates
            const coords = pincodeData.coordinates.map(coord => ({
              lat: coord[0],
              lng: coord[1]
            }));
            setPincodeBoundary(coords);
          }
        } catch (error) {
          console.error('Error fetching boundary:', error);
          // Fallback to stored coordinates
          const coords = pincodeData.coordinates.map(coord => ({
            lat: coord[0],
            lng: coord[1]
          }));
          setPincodeBoundary(coords);
        }
      } else {
        // Pincode not in stored list - try to fetch from Google Maps
        try {
          const response = await fetch(`/api/map/pincode-boundary?pincode=${pincode}`);
          if (response.ok) {
            const data = await response.json();
            if (data.boundary && data.boundary.length > 0) {
              // Found via Google Maps
              if (onPincodeSelect) {
                onPincodeSelect(pincode);
              } else {
                setInternalSelectedPincode(pincode);
              }
              
              // Use center from Google Maps or approximate center from boundary
              if (data.center) {
                setMapCenter({
                  lat: data.center.lat,
                  lng: data.center.lng
                });
              } else {
                // Calculate center from boundary
                const lats = data.boundary.map(b => b.lat);
                const lngs = data.boundary.map(b => b.lng);
                setMapCenter({
                  lat: (Math.max(...lats) + Math.min(...lats)) / 2,
                  lng: (Math.max(...lngs) + Math.min(...lngs)) / 2
                });
              }
              setMapZoom(14);
              setPincodeBoundary(data.boundary);
            } else {
              alert('Pincode not found. Please enter a valid Ahmedabad pincode.');
            }
          } else {
            alert('Pincode not found. Please enter a valid Ahmedabad pincode.');
          }
        } catch (error) {
          console.error('Error searching pincode:', error);
          alert('Pincode not found. Please enter a valid Ahmedabad pincode.');
        }
      }
    }
  };

  // Handle pincode selection and zoom
  useEffect(() => {
    if (selectedPincode) {
      const pincodeData = ahmedabadPincodes.find((p) => p.pincode === selectedPincode);
      if (pincodeData) {
        setMapCenter({
          lat: pincodeData.center[0],
          lng: pincodeData.center[1]
        });
        setMapZoom(14);
        setSearchPincode(selectedPincode);
        
        // Fetch boundary from server API
        fetchPincodeBoundary(selectedPincode).then(boundary => {
          if (boundary) {
            setPincodeBoundary(boundary);
          } else {
            const coords = pincodeData.coordinates.map(coord => ({
              lat: coord[0],
              lng: coord[1]
            }));
            setPincodeBoundary(coords);
          }
        }).catch(() => {
          const coords = pincodeData.coordinates.map(coord => ({
            lat: coord[0],
            lng: coord[1]
          }));
          setPincodeBoundary(coords);
        });
      }
    } else {
      if (externalSelectedPincode === null || externalSelectedPincode === undefined) {
        setMapCenter(defaultCenter);
        setMapZoom(12);
        setSearchPincode("");
        setPincodeBoundary(null);
      }
    }
  }, [selectedPincode, externalSelectedPincode, fetchPincodeBoundary]);

  // Handle map click
  const handleMapClick = (e) => {
    if (onMapClick && e.latLng) {
      onMapClick({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  };

  // Handle map load
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Territory Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-red-600">
            Error loading Google Maps. Please check your API key configuration.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Territory Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            Loading Google Maps...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Territory Map</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter pincode (e.g., 380015, 380007, 380006)"
            value={searchPincode}
            onChange={(e) => setSearchPincode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>Search Pincode</Button>
          {selectedPincode && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchPincode("");
                setPincodeBoundary(null);
                if (onPincodeSelect) {
                  onPincodeSelect(null);
                } else {
                  setInternalSelectedPincode(null);
                }
              }}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="relative w-full" style={{ height: "600px" }}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={mapZoom}
            onLoad={onMapLoad}
            onClick={handleMapClick}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {/* Render pincode boundary polygon with dashed red curved line */}
            {pincodeBoundary && pincodeBoundary.length > 0 && (
              <>
                {/* Fill area with curved boundary */}
                <Polygon
                  paths={pincodeBoundary}
                  options={{
                    fillColor: "#fee2e2",
                    fillOpacity: 0.2,
                    strokeColor: "transparent",
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    clickable: false,
                    draggable: false,
                    editable: false,
                    geodesic: false, // Set to false for straight lines between points (creates curves with many points)
                    zIndex: 1,
                  }}
                />
                {/* Dashed red border using Polyline - follows all coordinate points for curves */}
                <Polyline
                  path={[...pincodeBoundary, pincodeBoundary[0]]} // Close the path by adding first point at end
                  options={{
                    strokeColor: "transparent", // Hide base stroke, use only symbols
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    clickable: false,
                    geodesic: false, // Use straight segments between points (creates smooth curves with many points)
                    zIndex: 2,
                    // Create dashed line pattern like Google Maps
                    icons: [{
                      icon: {
                        path: 'M 0,0 8,0', // Small horizontal dash
                        strokeColor: '#dc2626',
                        strokeWeight: 3,
                        strokeOpacity: 1,
                        scale: 1
                      },
                      offset: '0%',
                      repeat: '16px' // Space between dashes
                    }]
                  }}
                />
              </>
            )}

            {/* Render user markers */}
            {users.map((user) => {
              const isInvestor = user.role === 'investor';
              const isVendor = user.role === 'vendor';
              const isBroker = user.role === 'broker';

              return (
                <Marker
                  key={`user-${user._id}`}
                  position={{
                    lat: user.latitude,
                    lng: user.longitude
                  }}
                  icon={getMarkerIcon(user.role)}
                  onClick={() => setSelectedUser(user)}
                />
              );
            })}

            {/* Info Window for selected user */}
            {selectedUser && (
              <InfoWindow
                position={{
                  lat: selectedUser.latitude,
                  lng: selectedUser.longitude
                }}
                onCloseClick={() => setSelectedUser(null)}
              >
                <div style={{ minWidth: "200px", padding: "8px" }}>
                  <b style={{ 
                    fontSize: "16px", 
                    color: selectedUser.role === 'investor' ? "#dc2626" : 
                           selectedUser.role === 'vendor' ? "#2563eb" : 
                           selectedUser.role === 'broker' ? "#eab308" : "#666" 
                  }}>
                    {selectedUser.name}
                  </b>
                  <br />
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    Role: {selectedUser.role}
                  </span>
                  <br />
                  <br />
                  {selectedUser.email && (
                    <>
                      <strong>Email:</strong> {selectedUser.email}
                      <br />
                    </>
                  )}
                  {(selectedUser.streetAddress || selectedUser.address) && (
                    <>
                      <strong>Address:</strong> {selectedUser.streetAddress || selectedUser.address}
                      <br />
                    </>
                  )}
                  {selectedUser.locality && (
                    <>
                      <strong>Locality:</strong> {selectedUser.locality}
                      <br />
                    </>
                  )}
                  {selectedUser.pincode && (
                    <>
                      <strong>Pincode:</strong> {selectedUser.pincode}
                      <br />
                    </>
                  )}
                  <br />
                  <div style={{ 
                    background: selectedUser.role === 'investor' ? "#fee2e2" : 
                               selectedUser.role === 'vendor' ? "#dbeafe" : 
                               selectedUser.role === 'broker' ? "#fef9c3" : "#f3f4f6", 
                    padding: "8px", 
                    borderRadius: "4px",
                    marginTop: "8px"
                  }}>
                    <strong style={{ 
                      color: selectedUser.role === 'investor' ? "#dc2626" : 
                             selectedUser.role === 'vendor' ? "#2563eb" : 
                             selectedUser.role === 'broker' ? "#eab308" : "#666" 
                    }}>
                      {selectedUser.role === 'investor' ? "🏢 Investor" : 
                       selectedUser.role === 'vendor' ? "🏪 Vendor" : 
                       selectedUser.role === 'broker' ? "🤝 Broker" : selectedUser.role}
                    </strong>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </CardContent>
    </Card>
  );
}
