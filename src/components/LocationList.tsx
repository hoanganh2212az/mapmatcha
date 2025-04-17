import { Location } from '../types';

interface LocationListProps {
  locations: Location[];
}

export function LocationList({ locations }: LocationListProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Danh sách địa điểm
      </h2>
      <div className="space-y-4">
        {locations.map((location, index) => (
          <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
            <p className="font-medium text-gray-800">{location.name}</p>
            <p className="text-gray-600 text-sm">{location.address}</p>
          </div>
        ))}
      </div>
    </div>
  );
}