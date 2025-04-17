import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// Mock data for locations
const addresses = [
  {
    name: "Cơ sở 1",
    address: "Số 2, ngách 2, ngõ 40 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội",
    coordinates: { lat: 21.0022, lng: 105.8471 }
  },
  {
    name: "Cơ sở 2",
    address: "Số 20, ngõ 183 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội",
    coordinates: { lat: 21.0018, lng: 105.8445 }
  },
  {
    name: "Cơ sở 3",
    address: "Ngõ 85 Xuân Thủy, Cầu Giấy, Hà Nội",
    coordinates: { lat: 21.0373, lng: 105.7827 }
  },
  {
    name: "Cơ sở 4",
    address: "42C Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
    coordinates: { lat: 21.0250, lng: 105.8486 }
  },
  {
    name: "Cơ sở 5",
    address: "62 Nguyễn Chí Thanh, Đống Đa, Hà Nội",
    coordinates: { lat: 21.0252, lng: 105.8091 }
  }
];

interface RouteInfo {
  location: typeof addresses[0];
  distance: string;
  duration: string;
}

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

// Fix Leaflet default icon path issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Route display component
function RouteDisplay({ from, to }: { from: L.LatLngExpression, to: L.LatLngExpression }) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!map) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(from[0], from[1]),
        L.latLng(to[0], to[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#0066CC', weight: 6 }]
      },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      })
    }).addTo(map);

    return () => {
      if (map && routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, from, to]);

  return null;
}

// Component to handle map updates
function MapUpdater({ center, zoom }: { center?: L.LatLngExpression, zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
}

function App() {
  const [searchAddress, setSearchAddress] = useState("");
  const [nearestLocation, setNearestLocation] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([21.0285, 105.8542]);
  const [mapZoom, setMapZoom] = useState(13);
  const [userLocation, setUserLocation] = useState<L.LatLngExpression | null>(null);

  const findNearestLocation = async () => {
    if (!searchAddress) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Nominatim for geocoding
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

      // Find nearest location
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

      // Update map center and zoom to show both points
      const bounds = L.latLngBounds(
        [searchLocation.lat, searchLocation.lng],
        [nearest.coordinates.lat, nearest.coordinates.lng]
      );
      const center = bounds.getCenter();
      setMapCenter([center.lat, center.lng]);
      setMapZoom(12);

      // Update nearest location info
      setNearestLocation({
        location: nearest,
        distance: `${shortestDistance.toFixed(2)} km`,
        duration: `${Math.round(shortestDistance * 3)} minutes` // Rough estimate
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

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Nhập địa chỉ của bạn..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={findNearestLocation}
              disabled={loading}
              className={`px-6 py-2 rounded-lg flex items-center justify-center gap-2 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search size={20} />
                  <span>Tìm kiếm</span>
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
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

          <div className="space-y-8">
            {nearestLocation && (
              <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Navigation className="text-blue-600" />
                  Địa điểm gần nhất theo đường đi
                </h2>
                <div className="space-y-3">
                  <p className="text-lg font-medium text-gray-800">
                    {nearestLocation.location.name}
                  </p>
                  <p className="text-gray-600">
                    {nearestLocation.location.address}
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Khoảng cách: {nearestLocation.distance}</p>
                    <p>Thời gian di chuyển: {nearestLocation.duration}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Danh sách địa điểm
              </h2>
              <div className="space-y-4">
                {addresses.map((location, index) => (
                  <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <p className="font-medium text-gray-800">{location.name}</p>
                    <p className="text-gray-600 text-sm">{location.address}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;