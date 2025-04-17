import { Navigation } from 'lucide-react';
import type { RouteInfo } from '../types';

interface NearestLocationProps {
  info: RouteInfo;
}

export function NearestLocation({ info }: NearestLocationProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Navigation className="text-blue-600" />
        Địa điểm gần nhất theo đường đi
      </h2>
      <div className="space-y-3">
        <p className="text-lg font-medium text-gray-800">
          {info.location.name}
        </p>
        <p className="text-gray-600">
          {info.location.address}
        </p>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Khoảng cách: {info.distance}</p>
          <p>Thời gian di chuyển: {info.duration}</p>
        </div>
      </div>
    </div>
  );
}