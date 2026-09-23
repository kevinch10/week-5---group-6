import { HDBTransaction, FlatType } from '../types';

export interface ApiHdbRecord {
  month: string;
  town: string;
  flat_type: string;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: number;
  flat_model: string;
  lease_commence_date: number;
  remaining_lease: string;
  resale_price: number;
  price_per_sqm: number;
}

export type FetchErrorType = 'refused' | 'unreachable' | 'unknown';

export interface HdbFetchError {
  type: FetchErrorType;
  upstreamStatus?: number | null;
  reason: string;
}

export function parseRemainingLeaseYears(
  remainingLease?: string,
  leaseCommenceDate?: number,
  transactionMonth?: string
): number {
  if (remainingLease && typeof remainingLease === 'string') {
    const match = remainingLease.match(/(\d+)\s*years?(?:\s*(\d+)\s*months?)?/i);
    if (match) {
      const yrs = parseInt(match[1], 10) || 0;
      const mos = parseInt(match[2], 10) || 0;
      return Number((yrs + mos / 12).toFixed(1));
    }
  }
  if (leaseCommenceDate && Number(leaseCommenceDate) > 1960) {
    const txYear = transactionMonth ? parseInt(transactionMonth.slice(0, 4), 10) : 2026;
    const elapsed = txYear - Number(leaseCommenceDate);
    return Math.max(0, Number((99 - elapsed).toFixed(1)));
  }
  return 65;
}

export function mapRecordToTransaction(row: ApiHdbRecord, index: number): HDBTransaction {
  const leaseYears = parseRemainingLeaseYears(
    row.remaining_lease,
    row.lease_commence_date,
    row.month
  );

  return {
    id: `tx-${row.town.toLowerCase().replace(/\s+/g, '-')}-${row.block}-${row.month}-${index}`,
    town: row.town,
    flatType: row.flat_type as FlatType,
    block: row.block,
    streetName: row.street_name,
    storeyRange: row.storey_range,
    floorArea: row.floor_area_sqm,
    flatModel: row.flat_model,
    resalePrice: row.resale_price,
    pricePerSqm: row.price_per_sqm,
    remainingLease: row.remaining_lease || `${leaseYears} years`,
    remainingLeaseYears: leaseYears,
    transactionMonth: row.month,
  };
}

// In-memory cache to prevent redundant re-fetching for already-loaded town and flat-type queries
const cache = new Map<string, HDBTransaction[]>();

export async function fetchLiveTransactions(
  town?: string,
  flatType?: string
): Promise<{ transactions: HDBTransaction[]; total: number }> {
  const cacheKey = `${town || 'ALL'}__${flatType || 'ALL'}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    return { transactions: cached, total: cached.length };
  }

  const params = new URLSearchParams();
  if (town && town !== 'ALL') {
    params.set('town', town);
  }
  if (flatType && flatType !== 'ALL') {
    params.set('flat_type', flatType);
  }

  const queryStr = params.toString();
  const url = queryStr ? `/api/hdb?${queryStr}` : '/api/hdb';

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err: any) {
    const error: HdbFetchError = {
      type: 'unreachable',
      upstreamStatus: null,
      reason: err?.message || 'Network request to data.gov.sg failed or server was unreachable.',
    };
    throw error;
  }

  // Check response.ok before attempting to read body
  if (!res.ok) {
    let reason = `HTTP ${res.status}`;
    let upstreamStatus = res.status;
    try {
      const errJson = await res.json();
      if (errJson?.reason) reason = errJson.reason;
      if (errJson?.upstreamStatus) upstreamStatus = errJson.upstreamStatus;
      if (errJson?.status === 'unreachable') {
        const error: HdbFetchError = {
          type: 'unreachable',
          upstreamStatus: null,
          reason,
        };
        throw error;
      }
    } catch (parseErr: any) {
      if (parseErr?.type === 'unreachable') throw parseErr;
    }

    const error: HdbFetchError = {
      type: 'refused',
      upstreamStatus,
      reason,
    };
    throw error;
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    const error: HdbFetchError = {
      type: 'refused',
      upstreamStatus: res.status,
      reason: 'Upstream returned unparseable content.',
    };
    throw error;
  }

  if (data?.ok === false) {
    if (data?.status === 'unreachable') {
      const error: HdbFetchError = {
        type: 'unreachable',
        upstreamStatus: null,
        reason: data.reason || 'data.gov.sg is unreachable.',
      };
      throw error;
    }
    const error: HdbFetchError = {
      type: 'refused',
      upstreamStatus: data?.upstreamStatus || res.status,
      reason: data?.reason || 'Request refused by data.gov.sg.',
    };
    throw error;
  }

  const rawRecords: ApiHdbRecord[] = Array.isArray(data?.records) ? data.records : [];
  const transactions = rawRecords.map((r, i) => mapRecordToTransaction(r, i));

  // Save to cache
  cache.set(cacheKey, transactions);

  return {
    transactions,
    total: Number(data?.total) || transactions.length,
  };
}
