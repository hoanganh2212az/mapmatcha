import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngExpression } from '../types';

interface MapUpdaterProps {
  center?: LatLngExpression;
  zoom?: number;
}

export function MapUpdater({ center, zoom }: MapUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
}