export interface Location {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface RouteInfo {
  location: Location;
  distance: string;
  duration: string;
}

export type LatLngExpression = [number, number];