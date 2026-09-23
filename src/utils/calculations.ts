import { HDBTransaction, TownSummary } from '../types';

/**
 * Calculates the median of an array of numbers.
 */
export function calculateMedian(numbers: number[]): number {
  if (!numbers.length) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Formats Singapore dollar currency.
 * e.g. 658000 -> "$658,000"
 */
export function formatSGD(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats compact SGD currency for charts and pills.
 * e.g. 658000 -> "$658k" or 1220000 -> "$1.22M"
 */
export function formatCompactSGD(amount: number): string {
  if (amount >= 1000000) {
    const val = (amount / 1000000).toFixed(2);
    return `$${val.replace(/\.00$/, '')}M`;
  }
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}k`;
  }
  return `$${amount}`;
}

/**
 * Formats Month string "2024-08" -> "Aug 2024"
 */
export function formatMonth(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
}

export interface MonthlyTrendPoint {
  month: string;
  formattedMonth: string;
  medianPrice: number;
  avgPrice: number;
  count: number;
}

export interface TrendPoint {
  key: string; // e.g. "2017" or "2024-05"
  label: string; // e.g. "Year 2017" or "May 2024"
  shortLabel: string; // e.g. "2017" or "May '24"
  periodType: 'year' | 'month';
  medianPrice: number;
  avgPrice: number;
  count: number;
}

/**
 * Generates sorted yearly trend points (default view).
 * Aggregates all transactions into annual median prices.
 */
export function getYearlyTrends(transactions: HDBTransaction[]): TrendPoint[] {
  if (transactions.length === 0) return [];
  const grouped: Record<string, number[]> = {};
  transactions.forEach((tx) => {
    const year = tx.transactionMonth.slice(0, 4);
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(tx.resalePrice);
  });

  const sortedYears = Object.keys(grouped).sort();
  return sortedYears.map((year) => {
    const prices = grouped[year];
    const median = calculateMedian(prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / prices.length);
    return {
      key: year,
      label: `Year ${year}`,
      shortLabel: year,
      periodType: 'year',
      medianPrice: median,
      avgPrice: avg,
      count: prices.length,
    };
  });
}

/**
 * Generates trend points for the past year (the latest 12 recorded market months).
 */
export function getPastYearTrends(transactions: HDBTransaction[]): TrendPoint[] {
  if (transactions.length === 0) return [];

  const grouped: Record<string, number[]> = {};
  transactions.forEach((tx) => {
    if (!grouped[tx.transactionMonth]) {
      grouped[tx.transactionMonth] = [];
    }
    grouped[tx.transactionMonth].push(tx.resalePrice);
  });

  const sortedMonths = Object.keys(grouped).sort();
  // Take the 12 most recent recorded months
  const recentMonths = sortedMonths.slice(-12);

  return recentMonths.map((m) => {
    const prices = grouped[m];
    const median = calculateMedian(prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / prices.length);
    const formatted = formatMonth(m);
    return {
      key: m,
      label: formatted,
      shortLabel: `${formatted.split(' ')[0]} '${m.slice(2, 4)}`,
      periodType: 'month',
      medianPrice: median,
      avgPrice: avg,
      count: prices.length,
    };
  });
}

/**
 * Generates trend points for the past six recorded months.
 */
export function getPastSixMonthsTrends(transactions: HDBTransaction[]): TrendPoint[] {
  if (transactions.length === 0) return [];

  const grouped: Record<string, number[]> = {};
  transactions.forEach((tx) => {
    if (!grouped[tx.transactionMonth]) {
      grouped[tx.transactionMonth] = [];
    }
    grouped[tx.transactionMonth].push(tx.resalePrice);
  });

  const sortedMonths = Object.keys(grouped).sort();
  // Take the 6 most recent recorded months
  const recentMonths = sortedMonths.slice(-6);

  return recentMonths.map((m) => {
    const prices = grouped[m];
    const median = calculateMedian(prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / prices.length);
    const formatted = formatMonth(m);
    return {
      key: m,
      label: formatted,
      shortLabel: `${formatted.split(' ')[0]} '${m.slice(2, 4)}`,
      periodType: 'month',
      medianPrice: median,
      avgPrice: avg,
      count: prices.length,
    };
  });
}

/**
 * Returns available unique transaction years in sorted ascending or descending order.
 */
export function getAvailableYears(transactions: HDBTransaction[]): string[] {
  if (transactions.length === 0) {
    return ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
  }
  const set = new Set<string>();
  transactions.forEach((tx) => {
    const y = tx.transactionMonth.slice(0, 4);
    if (y) set.add(y);
  });
  return Array.from(set).sort().reverse();
}

/**
 * Generates monthly trend points for a designated single year (e.g. 2017, 2018, 2024).
 */
export function getDesignatedYearTrends(
  transactions: HDBTransaction[],
  year: string
): TrendPoint[] {
  if (transactions.length === 0 || !year) return [];

  const filtered = transactions.filter((tx) => tx.transactionMonth.startsWith(year));
  if (filtered.length === 0) return [];

  const grouped: Record<string, number[]> = {};
  filtered.forEach((tx) => {
    if (!grouped[tx.transactionMonth]) {
      grouped[tx.transactionMonth] = [];
    }
    grouped[tx.transactionMonth].push(tx.resalePrice);
  });

  const sortedMonths = Object.keys(grouped).sort();
  return sortedMonths.map((m) => {
    const prices = grouped[m];
    const median = calculateMedian(prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / prices.length);
    const formatted = formatMonth(m);
    return {
      key: m,
      label: formatted,
      shortLabel: formatted.split(' ')[0], // e.g. "Jan", "Feb", "Mar"
      periodType: 'month',
      medianPrice: median,
      avgPrice: avg,
      count: prices.length,
    };
  });
}

/**
 * Generates sorted monthly trend points from filtered transactions.
 */
export function getMonthlyTrends(transactions: HDBTransaction[]): MonthlyTrendPoint[] {
  if (transactions.length === 0) return [];

  const grouped: Record<string, number[]> = {};
  transactions.forEach((tx) => {
    if (!grouped[tx.transactionMonth]) {
      grouped[tx.transactionMonth] = [];
    }
    grouped[tx.transactionMonth].push(tx.resalePrice);
  });

  const sortedMonths = Object.keys(grouped).sort();
  return sortedMonths.map((month) => {
    const prices = grouped[month];
    const median = calculateMedian(prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / prices.length);
    return {
      month,
      formattedMonth: formatMonth(month),
      medianPrice: median,
      avgPrice: avg,
      count: prices.length,
    };
  });
}

/**
 * Determines overall price movement trend (rising, falling, or stable).
 */
export function getTrendSummary(trendPoints: MonthlyTrendPoint[]): {
  direction: 'rising' | 'falling' | 'stable';
  changePercent: number;
  description: string;
} {
  if (trendPoints.length < 2) {
    return {
      direction: 'stable',
      changePercent: 0,
      description: 'Insufficient historical data for trend',
    };
  }

  const firstPoint = trendPoints[0].medianPrice;
  const lastPoint = trendPoints[trendPoints.length - 1].medianPrice;
  const change = ((lastPoint - firstPoint) / firstPoint) * 100;
  const rounded = Number(change.toFixed(1));

  if (rounded >= 2.0) {
    return {
      direction: 'rising',
      changePercent: rounded,
      description: `Prices rising (+${rounded}% since ${trendPoints[0].formattedMonth})`,
    };
  }
  if (rounded <= -2.0) {
    return {
      direction: 'falling',
      changePercent: rounded,
      description: `Prices easing (${rounded}% since ${trendPoints[0].formattedMonth})`,
    };
  }
  return {
    direction: 'stable',
    changePercent: rounded,
    description: `Prices relatively stable (${rounded >= 0 ? '+' : ''}${rounded}% variation)`,
  };
}

/**
 * Computes town summary statistics for side-by-side comparison.
 */
export function computeTownSummary(town: string, allTransactions: HDBTransaction[]): TownSummary {
  const townTxs = allTransactions.filter((tx) => tx.town === town);
  if (townTxs.length === 0) {
    return {
      town,
      medianPrice: 0,
      avgPricePerSqm: 0,
      transactionCount: 0,
      priceChangePercent: 0,
      highestPrice: 0,
      lowestPrice: 0,
      flatTypeBreakdown: {},
    };
  }

  const prices = townTxs.map((t) => t.resalePrice);
  const medianPrice = calculateMedian(prices);
  const highestPrice = Math.max(...prices);
  const lowestPrice = Math.min(...prices);

  const totalPsm = townTxs.reduce((acc, t) => acc + t.pricePerSqm, 0);
  const avgPricePerSqm = Math.round(totalPsm / townTxs.length);

  // Calculate recent price change (latest half vs earlier half)
  const sortedByMonth = [...townTxs].sort((a, b) =>
    a.transactionMonth.localeCompare(b.transactionMonth)
  );
  const mid = Math.floor(sortedByMonth.length / 2);
  const earlier = sortedByMonth.slice(0, mid).map((t) => t.resalePrice);
  const recent = sortedByMonth.slice(mid).map((t) => t.resalePrice);

  const earlierMedian = earlier.length ? calculateMedian(earlier) : medianPrice;
  const recentMedian = recent.length ? calculateMedian(recent) : medianPrice;
  const changePercent =
    earlierMedian > 0
      ? Number((((recentMedian - earlierMedian) / earlierMedian) * 100).toFixed(1))
      : 0;

  const flatTypeBreakdown: Record<string, number> = {};
  townTxs.forEach((t) => {
    flatTypeBreakdown[t.flatType] = (flatTypeBreakdown[t.flatType] || 0) + 1;
  });

  return {
    town,
    medianPrice,
    avgPricePerSqm,
    transactionCount: townTxs.length,
    priceChangePercent: changePercent,
    highestPrice,
    lowestPrice,
    flatTypeBreakdown,
  };
}

/**
 * Assesses whether a specific transaction is cheap, typical, or expensive
 * compared to similar flats (same town & same flat type).
 */
export function evaluateTransactionValue(
  target: HDBTransaction,
  allTransactions: HDBTransaction[]
): {
  peerMedian: number;
  diffAmount: number;
  diffPercent: number;
  tag: 'Below Typical' | 'Typical Range' | 'Above Typical';
  verdict: string;
} {
  const peers = allTransactions.filter(
    (t) => t.town === target.town && t.flatType === target.flatType
  );

  const peerPrices = peers.map((p) => p.resalePrice);
  const peerMedian = calculateMedian(peerPrices);
  const diffAmount = target.resalePrice - peerMedian;
  const diffPercent = peerMedian > 0 ? Number(((diffAmount / peerMedian) * 100).toFixed(1)) : 0;

  let tag: 'Below Typical' | 'Typical Range' | 'Above Typical' = 'Typical Range';
  let verdict = 'In line with typical resale transactions in this area.';

  if (diffPercent <= -3.5) {
    tag = 'Below Typical';
    verdict = `Priced ${Math.abs(diffPercent)}% below the town median for ${target.flatType} flats. Represents great relative value.`;
  } else if (diffPercent >= 3.5) {
    tag = 'Above Typical';
    verdict = `Priced ${diffPercent}% above the town median for ${target.flatType} flats, likely due to high floor, premium stack, or longer remaining lease.`;
  } else {
    verdict = `Priced within ${Math.abs(diffPercent)}% of the ${target.town} median (${formatSGD(peerMedian)}). Closely aligns with fair market valuation.`;
  }

  return {
    peerMedian,
    diffAmount,
    diffPercent,
    tag,
    verdict,
  };
}
