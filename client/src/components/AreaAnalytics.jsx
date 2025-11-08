import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Loader2 } from 'lucide-react';

export default function AreaAnalytics() {
  const [pincode, setPincode] = useState('');
  const [radius, setRadius] = useState('5000');
  const [loading, setLoading] = useState(false);
  const [poiData, setPoiData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleSearch = async () => {
    if (!pincode.trim()) {
      alert('Please enter a pincode');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/maps/poi-summary?pincode=${pincode}&radius=${radius}`);
      if (response.ok) {
        const data = await response.json();
        setPoiData(data);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to fetch area data');
      }
    } catch (error) {
      console.error('Error fetching POI data:', error);
      alert('Failed to fetch area data');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (category) => {
    setSelectedCategory(category);
    setDetailsOpen(true);
  };

  const openInGoogleMaps = (place) => {
    if (place.placeId) {
      window.open(`https://www.google.com/maps/place/?q=place_id:${place.placeId}`, '_blank');
    } else if (place.location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`, '_blank');
    }
  };

  const radiusOptions = [
    { value: '5000', label: '5 km' },
    { value: '10000', label: '10 km' },
    { value: '15000', label: '15 km' },
    { value: '20000', label: '20 km' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Area Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter pincode (e.g., 380015)"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Radius" />
              </SelectTrigger>
              <SelectContent>
                {radiusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {poiData && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Showing results for pincode {pincode} within {parseInt(radius) / 1000} km radius
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {poiData.summary.map((category) => (
                  <Card
                    key={category.type}
                    className="cursor-pointer hover:bg-accent hover:shadow-md transition-all"
                    onClick={() => category.count > 0 && handleCardClick(category)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl mb-2">{category.icon}</div>
                      <div className="font-semibold text-sm mb-1">{category.label}</div>
                      <div className="text-2xl font-bold text-primary">{category.count}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory?.icon} {selectedCategory?.label}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCategory && selectedCategory.places.length > 0 ? (
            <div className="space-y-3">
              {selectedCategory.places.map((place, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => openInGoogleMaps(place)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">{place.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {place.vicinity}
                        </p>
                        {place.rating && (
                          <div className="mt-2 flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-sm font-medium">{place.rating}</span>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        openInGoogleMaps(place);
                      }}>
                        View on Map
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {selectedCategory.count > 5 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  Showing top 5 of {selectedCategory.count} {selectedCategory.label.toLowerCase()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No {selectedCategory?.label.toLowerCase()} found in this area
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
