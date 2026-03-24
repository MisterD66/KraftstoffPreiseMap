export interface GasStation {
  id: number;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
  prices: {
    fuelType: string;
    amount: number;
    label: string;
  }[];
  distance?: number;
}

export interface SearchLog {
  pointsQueried: number;
  totalFound: number;
  uniqueFound: number;
  durationMs: number;
  timestamp: string;
}
