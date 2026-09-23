export type Screen = 'explore' | 'compare' | 'detail';

export type FlatType = '3 ROOM' | '4 ROOM' | '5 ROOM' | 'EXECUTIVE';

export interface HDBTransaction {
  id: string;
  town: string;
  flatType: FlatType;
  block: string;
  streetName: string;
  storeyRange: string;
  floorArea: number; // in square metres (sqm)
  flatModel?: string; // e.g. "Model A", "Improved", "New Generation"
  resalePrice: number; // in SGD
  pricePerSqm: number; // in SGD/sqm
  remainingLease: string; // e.g. "93 years 04 months"
  remainingLeaseYears: number; // e.g. 93.3
  transactionMonth: string; // e.g. "2024-08"
}

export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'price_asc'
  | 'price_desc'
  | 'lease_desc'
  | 'lease_asc'
  | 'psm_asc'
  | 'psm_desc'
  | 'area_desc'
  | 'area_asc';

export interface FilterState {
  town: string;
  flatType: string;
  year?: string;
  sortBy: SortOption;
}

export interface TownSummary {
  town: string;
  medianPrice: number;
  avgPricePerSqm: number;
  transactionCount: number;
  priceChangePercent: number; // % change compared to early period
  highestPrice: number;
  lowestPrice: number;
  flatTypeBreakdown: Record<string, number>;
}

export type TrendTimeframe = '2017_2026' | 'past_year' | 'past_six_months' | 'designated_year';
