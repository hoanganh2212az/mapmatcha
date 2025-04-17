import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

import { addresses } from './data/locations';
import { RouteDisplay } from './components/RouteDisplay';
import { MapUpdater } from './components/MapUpdater';
import { SearchBar } from './components/SearchBar';
import { NearestLocation } from './components/NearestLocation';
import { LocationList } from './components/LocationList';
import { calculateDistance, createCustomIcon, calculateMapCenter, calculateInitialZoom } from './utils/map';
import type { RouteInfo, LatLngExpression } from './types';

// Fix Leaflet default icon path issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function App() {
  const [searchAddress, setSearchAddress] = useState("");
  const [nearestLocation, setNearestLocation] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(calculateMapCenter(addresses));
  const [mapZoom, setMapZoom] = useState(calculateInitialZoom());
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);

  const findNearestLocation = async () => {
    if (!searchAddress) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}`);
      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error('Address not found. Please check the address and try again.');
      }

      const searchLocation = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };

      setUserLocation([searchLocation.lat, searchLocation.lng]);

      let nearest = addresses[0];
      let shortestDistance = calculateDistance(
        searchLocation.lat,
        searchLocation.lng,
        nearest.coordinates.lat,
        nearest.coordinates.lng
      );

      addresses.forEach(location => {
        const distance = calculateDistance(
          searchLocation.lat,
          searchLocation.lng,
          location.coordinates.lat,
          location.coordinates.lng
        );
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearest = location;
        }
      });

      // Create bounds that include both the user location and nearest location
      const userLatLng = L.latLng(searchLocation.lat, searchLocation.lng);
      const nearestLatLng = L.latLng(nearest.coordinates.lat, nearest.coordinates.lng);
      
      // Create a bounds object and extend it to include both points
      const bounds = L.latLngBounds([userLatLng, nearestLatLng]);
      
      // Add some padding to the bounds (10% of the total bounds)
      const paddedBounds = bounds.pad(0.1);
      
      // Calculate the center point of the padded bounds
      const center = paddedBounds.getCenter();
      setMapCenter([center.lat, center.lng]);

      // Calculate appropriate zoom level based on the bounds
      const tempMap = L.map(document.createElement('div'));
      tempMap.fitBounds(paddedBounds);
      setMapZoom(tempMap.getZoom());
      tempMap.remove();

      setNearestLocation({
        location: nearest,
        distance: `${shortestDistance.toFixed(2)} km`,
        duration: `${Math.round(shortestDistance * 3)} minutes`
      });

    } catch (err) {
      console.error('Error finding nearest location:', err);
      setError(err instanceof Error ? err.message : 'Failed to find location. Please check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Tìm Địa Điểm Gần Nhất
          </h1>
          <p className="text-gray-600">
            Nhập địa chỉ của bạn để tìm địa điểm gần nhất theo đường đi thực tế
          </p>
        </div>

        <SearchBar
          value={searchAddress}
          onChange={setSearchAddress}
          onSearch={findNearestLocation}
          loading={loading}
          error={error}
        />

        <div className="flex flex-col md:grid md:grid-cols-2 gap-8">
          {/* Nearest Location - Mobile Only */}
          {nearestLocation && (
            <div className="md:hidden">
              <NearestLocation info={nearestLocation} />
            </div>
          )}

          {/* Map */}
          <div className="h-[400px] md:h-[600px] rounded-lg shadow-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={mapCenter} zoom={mapZoom} />
              {addresses.map((location, index) => (
                <Marker
                  key={index}
                  position={[location.coordinates.lat, location.coordinates.lng]}
                  icon={createCustomIcon('#0066CC')}
                >
                  <Popup>
                    <div className="font-medium">{location.name}</div>
                    <div className="text-sm">{location.address}</div>
                  </Popup>
                </Marker>
              ))}
              {userLocation && nearestLocation && (
                <>
                  <Marker
                    position={userLocation}
                    icon={createCustomIcon('#00CC66')}
                  >
                    <Popup>Your Location</Popup>
                  </Marker>
                  <RouteDisplay
                    from={userLocation}
                    to={[nearestLocation.location.coordinates.lat, nearestLocation.location.coordinates.lng]}
                  />
                </>
              )}
            </MapContainer>
          </div>

          {/* Desktop Layout */}
          <div className="space-y-8">
            {/* Nearest Location - Desktop Only */}
            <div className="hidden md:block">
              {nearestLocation && <NearestLocation info={nearestLocation} />}
            </div>
            {/* Location List */}
            <LocationList locations={addresses} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;