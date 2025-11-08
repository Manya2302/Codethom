import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, useMap, Tooltip, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { ahmedabadPincodes } from "../data/ahmedabadPincodes";
import { getUserCoordinates } from "../data/ahmedabadLocalities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Fix for Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom red flag icon for investor users
const createRedFlagIcon = () => {
  return L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
  });
};

// Custom blue flag icon for vendor users
const createBlueFlagIcon = () => {
  return L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
  });
};

// Custom yellow flag icon for broker users
const createYellowFlagIcon = () => {
  return L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/10796/10796995.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
  });
};

const redFlagIcon = createRedFlagIcon();
const blueFlagIcon = createBlueFlagIcon();
const yellowFlagIcon = createYellowFlagIcon();

// Component to control map zoom and pan
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [center, zoom, map]);

  return null;
};

// Individual Pincode Polygon Component
const PincodePolygon = ({ pincodeData, isSelected, onSelect }) => {
  const polygonRef = useRef(null);

  const defaultStyle = {
    color: "#666",
    fillColor: "transparent",
    fillOpacity: 0,
    weight: 1.5,
    opacity: 0.7,
  };

  // Highlighted style for selected polygon - prominent red border with curved edges
  const selectedStyle = {
    color: "#dc2626", // Bright red border
    fillColor: "#fee2e2", // Light red fill
    fillOpacity: 0.3, // Semi-transparent red fill
    weight: 4, // Thick border for visibility
    opacity: 1,
    dashArray: null, // Solid line
  };

  useEffect(() => {
    if (polygonRef.current) {
      const style = isSelected ? selectedStyle : defaultStyle;
      polygonRef.current.setStyle(style);
      // Force redraw
      polygonRef.current.redraw();
    }
  }, [isSelected, pincodeData]);

  return (
    <Polygon
      ref={polygonRef}
      positions={pincodeData.coordinates}
      pathOptions={isSelected ? selectedStyle : defaultStyle}
      smoothFactor={1.0}
      eventHandlers={{
        click: () => onSelect && onSelect(pincodeData.pincode),
        mouseover: (e) => {
          if (!isSelected && polygonRef.current) {
            polygonRef.current.setStyle({
              ...defaultStyle,
              color: "#3b82f6",
              weight: 2,
              opacity: 0.9,
            });
          } else if (isSelected && polygonRef.current) {
            // Make it even more prominent on hover
            polygonRef.current.setStyle({
              ...selectedStyle,
              weight: 5,
              fillOpacity: 0.4,
            });
          }
        },
        mouseout: (e) => {
          if (!isSelected && polygonRef.current) {
            polygonRef.current.setStyle(defaultStyle);
          } else if (isSelected && polygonRef.current) {
            polygonRef.current.setStyle(selectedStyle);
          }
        },
      }}
    >
      <Tooltip permanent={false} direction="center" className="pincode-tooltip">
        <div className="text-center">
          <strong>PIN: {pincodeData.pincode}</strong>
          <br />
          <span className="text-xs">{pincodeData.name}</span>
        </div>
      </Tooltip>
    </Polygon>
  );
};

// Component to handle map clicks
const MapClickHandler = ({ onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    if (!onMapClick) return;

    const handleClick = (e) => {
      console.log('Map clicked at:', e.latlng);
      if (onMapClick) {
        onMapClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
};

export default function MapView({ selectedPincode: externalSelectedPincode, onPincodeSelect, onMapClick }) {
  const [mapCenter, setMapCenter] = useState([23.0225, 72.5714]); // Ahmedabad center
  const [mapZoom, setMapZoom] = useState(12);
  const [users, setUsers] = useState([]);
  const [searchPincode, setSearchPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [internalSelectedPincode, setInternalSelectedPincode] = useState(null);
  
  // Use external selectedPincode if provided, otherwise use internal state
  const selectedPincode = externalSelectedPincode !== undefined ? externalSelectedPincode : internalSelectedPincode;

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
        // Map registrations to display format
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
  const handleSearch = () => {
    if (searchPincode.trim()) {
      const pincode = searchPincode.trim();
      const pincodeData = ahmedabadPincodes.find((p) => p.pincode === pincode);
      console.log('Searching for pincode:', pincode, 'Found:', pincodeData);
      if (pincodeData) {
        // Set the selected pincode (either internal or external)
        if (onPincodeSelect) {
          onPincodeSelect(pincode);
        } else {
          setInternalSelectedPincode(pincode);
        }
        setMapCenter(pincodeData.center);
        setMapZoom(14);
        console.log('Pincode selected, boundary should render');
      } else {
        alert('Pincode not found. Please enter a valid Ahmedabad pincode.');
      }
    }
  };

  // Handle pincode selection and zoom
  useEffect(() => {
    if (selectedPincode) {
      const pincodeData = ahmedabadPincodes.find((p) => p.pincode === selectedPincode);
      if (pincodeData) {
        setMapCenter(pincodeData.center);
        setMapZoom(14);
        setSearchPincode(selectedPincode);
      }
    } else {
      // Only reset if explicitly cleared
      if (externalSelectedPincode === null || externalSelectedPincode === undefined) {
        setMapCenter([23.0225, 72.5714]);
        setMapZoom(12);
        setSearchPincode("");
      }
    }
  }, [selectedPincode, externalSelectedPincode]);

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
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onMapClick={onMapClick} />

            {/* Render only the selected pincode polygon when searched */}
            {selectedPincode && (() => {
              const pincodeData = ahmedabadPincodes.find(
                (p) => p.pincode === selectedPincode
              );
              console.log('Attempting to render boundary for pincode:', selectedPincode, 'Data:', pincodeData);
              if (pincodeData && pincodeData.coordinates && pincodeData.coordinates.length > 0) {
                console.log('Rendering polygon with coordinates:', pincodeData.coordinates);
                return (
                  <PincodePolygon
                    key={`pincode-${pincodeData.pincode}-${selectedPincode}`}
                    pincodeData={pincodeData}
                    isSelected={true}
                    onSelect={(pincode) => {
                      if (onPincodeSelect) {
                        onPincodeSelect(pincode);
                      } else {
                        setInternalSelectedPincode(pincode);
                      }
                    }}
                  />
                );
              } else {
                console.warn('Pincode data not found or invalid coordinates for:', selectedPincode);
              }
              return null;
            })()}

            {/* Render user markers */}
            {users.map((user, i) => {
              const isInvestor = user.role === 'investor';
              const isVendor = user.role === 'vendor';
              const isBroker = user.role === 'broker';
              
              let userIcon = undefined;
              if (isInvestor) {
                userIcon = redFlagIcon;
              } else if (isVendor) {
                userIcon = blueFlagIcon;
              } else if (isBroker) {
                userIcon = yellowFlagIcon;
              }

              const markerIcon = L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                shadowSize: [41, 41],
                shadowAnchor: [12, 41],
              });

              return (
                <Marker
                  key={`user-${i}`}
                  position={[user.latitude, user.longitude]}
                  icon={markerIcon}
                  eventHandlers={{
                    add: (e) => {
                      if (e.target._icon) {
                        if (isVendor) {
                          e.target._icon.style.filter = 'hue-rotate(200deg) saturate(1.5) brightness(1.1)';
                        } else if (isBroker) {
                          e.target._icon.style.filter = 'hue-rotate(45deg) saturate(1.5) brightness(1.1)';
                        } else if (isInvestor) {
                          e.target._icon.style.filter = 'hue-rotate(0deg) saturate(1.5) brightness(1.1)';
                        }
                      }
                    }
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: "200px" }}>
                      <b style={{ 
                        fontSize: "16px", 
                        color: isInvestor ? "#dc2626" : isVendor ? "#2563eb" : isBroker ? "#eab308" : "#666" 
                      }}>
                        {user.name}
                      </b>
                      <br />
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        Role: {user.role}
                      </span>
                      <br />
                      <br />
                      {user.email && (
                        <>
                          <strong>Email:</strong> {user.email}
                          <br />
                        </>
                      )}
                      {(user.streetAddress || user.address) && (
                        <>
                          <strong>Address:</strong> {user.streetAddress || user.address}
                          <br />
                        </>
                      )}
                      {user.locality && (
                        <>
                          <strong>Locality:</strong> {user.locality}
                          <br />
                        </>
                      )}
                      {user.pincode && (
                        <>
                          <strong>Pincode:</strong> {user.pincode}
                          <br />
                        </>
                      )}
                      <br />
                      <div style={{ 
                        background: isInvestor ? "#fee2e2" : isVendor ? "#dbeafe" : isBroker ? "#fef9c3" : "#f3f4f6", 
                        padding: "8px", 
                        borderRadius: "4px",
                        marginTop: "8px"
                      }}>
                        <strong style={{ 
                          color: isInvestor ? "#dc2626" : isVendor ? "#2563eb" : isBroker ? "#eab308" : "#666" 
                        }}>
                          {isInvestor ? "🏢 Investor" : isVendor ? "🏪 Vendor" : isBroker ? "🤝 Broker" : user.role}
                        </strong>
                      </div>
                    </div>
                  </Popup>
                  <Tooltip permanent={false} direction="top">
                    <strong>{user.role}</strong>
                    <br />
                    {user.name}
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}

