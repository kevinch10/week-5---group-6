import { HDBTransaction, FlatType, SortOption } from '../types';
import { SELECTABLE_TOWNS } from '../data/hdbData';

export interface ParsedSearchQuery {
  raw: string;
  minPrice?: number;
  maxPrice?: number;
  minFloor?: number;
  maxFloor?: number;
  minArea?: number;
  maxArea?: number;
  detectedTown?: string;
  detectedFlatType?: FlatType;
  detectedYear?: string;
  detectedSort?: SortOption;
  keywords: string[];
}

export interface SearchPreset {
  id: string;
  label: string;
  query: string;
  description: string;
}

export const POPULAR_SEARCH_PRESETS: SearchPreset[] = [
  {
    id: 'preset-4rm-tampines',
    label: 'Tampines 4 Room',
    query: 'Tampines 4 Room',
    description: '4-Room flats in Tampines',
  },
  {
    id: 'preset-longest-lease',
    label: '⏳ Longest Lease',
    query: 'longest lease',
    description: 'Sort flats by longest remaining lease',
  },
  {
    id: 'preset-cheapest-price',
    label: '💰 Lowest Price',
    query: 'cheapest',
    description: 'Sort flats by lowest resale price',
  },
  {
    id: 'preset-high-floor',
    label: 'High Floor (10+ Storey)',
    query: 'high floor',
    description: 'Flats on 10th floor or higher',
  },
  {
    id: 'preset-under-550k',
    label: 'Under $550k',
    query: '<550k',
    description: 'Resale flats priced below $550,000',
  },
  {
    id: 'preset-executive',
    label: 'Executive Flats',
    query: 'Executive',
    description: 'Spacious executive apartments & maisonettes',
  },
];

export const TOWN_MATCHERS: { pattern: RegExp; town: string }[] = [
  { pattern: /\b(?:ang\s*mo\s*kio|amk)\b/i, town: 'ANG MO KIO' },
  { pattern: /\b(?:bedok)\b/i, town: 'BEDOK' },
  { pattern: /\b(?:bishan)\b/i, town: 'BISHAN' },
  { pattern: /\b(?:bukit\s*batok|bt\s*batok)\b/i, town: 'BUKIT BATOK' },
  { pattern: /\b(?:bukit\s*merah|bt\s*merah)\b/i, town: 'BUKIT MERAH' },
  { pattern: /\b(?:bukit\s*panjang|bt\s*panjang)\b/i, town: 'BUKIT PANJANG' },
  { pattern: /\b(?:bukit\s*timah|bt\s*timah)\b/i, town: 'BUKIT TIMAH' },
  { pattern: /\b(?:central\s*area|central)\b/i, town: 'CENTRAL AREA' },
  { pattern: /\b(?:choa\s*chu\s*kang|cck)\b/i, town: 'CHOA CHU KANG' },
  { pattern: /\b(?:clementi)\b/i, town: 'CLEMENTI' },
  { pattern: /\b(?:geylang)\b/i, town: 'GEYLANG' },
  { pattern: /\b(?:hougang)\b/i, town: 'HOUGANG' },
  { pattern: /\b(?:jurong\s*east)\b/i, town: 'JURONG EAST' },
  { pattern: /\b(?:jurong\s*west)\b/i, town: 'JURONG WEST' },
  { pattern: /\b(?:kallang[\s/]*whampoa|kallang|whampoa)\b/i, town: 'KALLANG/WHAMPOA' },
  { pattern: /\b(?:marine\s*parade)\b/i, town: 'MARINE PARADE' },
  { pattern: /\b(?:pasir\s*ris)\b/i, town: 'PASIR RIS' },
  { pattern: /\b(?:punggol)\b/i, town: 'PUNGGOL' },
  { pattern: /\b(?:queenstown)\b/i, town: 'QUEENSTOWN' },
  { pattern: /\b(?:sembawang)\b/i, town: 'SEMBAWANG' },
  { pattern: /\b(?:sengkang)\b/i, town: 'SENGKANG' },
  { pattern: /\b(?:serangoon)\b/i, town: 'SERANGOON' },
  { pattern: /\b(?:tampines)\b/i, town: 'TAMPINES' },
  { pattern: /\b(?:toa\s*payoh|tpy)\b/i, town: 'TOA PAYOH' },
  { pattern: /\b(?:woodlands)\b/i, town: 'WOODLANDS' },
  { pattern: /\b(?:yishun)\b/i, town: 'YISHUN' },
];

export const FLAT_TYPE_MATCHERS: { pattern: RegExp; flatType: FlatType }[] = [
  { pattern: /\b(?:3\s*rooms?|3-rooms?|3rm)\b/i, flatType: '3 ROOM' },
  { pattern: /\b(?:4\s*rooms?|4-rooms?|4rm)\b/i, flatType: '4 ROOM' },
  { pattern: /\b(?:5\s*rooms?|5-rooms?|5rm)\b/i, flatType: '5 ROOM' },
  { pattern: /\b(?:executive|exec|maisonette|ea|em)\b/i, flatType: 'EXECUTIVE' },
];

export function parseMultiSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = query.trim();
  if (!trimmed) {
    return { raw: '', keywords: [] };
  }

  let text = trimmed;
  let minPrice: number | undefined;
  let maxPrice: number | undefined;
  let minFloor: number | undefined;
  let maxFloor: number | undefined;
  let minArea: number | undefined;
  let maxArea: number | undefined;
  let detectedTown: string | undefined;
  let detectedFlatType: FlatType | undefined;
  let detectedYear: string | undefined;

  // 1. Price Budget Range: e.g. "500k-700k", "$500k - $700k"
  const rangeMatch = text.match(/\$?(\d+(?:\.\d+)?)\s*k?\s*(?:-|to)\s*\$?(\d+(?:\.\d+)?)\s*(k|m)?/i);
  if (rangeMatch) {
    let low = parseFloat(rangeMatch[1]);
    let high = parseFloat(rangeMatch[2]);
    const unit = (rangeMatch[3] || '').toLowerCase();
    if (low < 1000) low *= 1000;
    if (high < 1000) high *= 1000;
    if (unit === 'm') {
      low *= 1000;
      high *= 1000;
    }
    minPrice = low;
    maxPrice = high;
    text = text.replace(rangeMatch[0], ' ');
  }

  // Max price constraint: e.g. "<500k", "<=600k", "under 600k", "below $700k", "< 650000"
  const maxPriceMatch = text.match(/(?:<|<=|under|below|max)\s*\$?(\d+(?:\.\d+)?)\s*(k|m|million|thousand)?/i);
  if (maxPriceMatch) {
    let val = parseFloat(maxPriceMatch[1]);
    const unit = (maxPriceMatch[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'thousand') val *= 1000;
    else if (unit === 'm' || unit === 'million') val *= 1000000;
    else if (val < 1000) val *= 1000;
    maxPrice = val;
    text = text.replace(maxPriceMatch[0], ' ');
  }

  // Min price constraint: e.g. ">500k", "above 400k", "over 600k", "min 500k", ">$500k"
  const minPriceMatch = text.match(/(?:>|>=|above|over|more\s*than|min)\s*\$?(\d+(?:\.\d+)?)\s*(k|m|million|thousand)?/i);
  if (minPriceMatch) {
    let val = parseFloat(minPriceMatch[1]);
    const unit = (minPriceMatch[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'thousand') val *= 1000;
    else if (unit === 'm' || unit === 'million') val *= 1000000;
    else if (val < 1000) val *= 1000;
    minPrice = val;
    text = text.replace(minPriceMatch[0], ' ');
  }

  // 2. Floor Level Detection
  if (/\b(?:high\s*floor|high\s*storey|top\s*floor)\b/i.test(text)) {
    minFloor = 10;
    text = text.replace(/\b(?:high\s*floor|high\s*storey|top\s*floor)\b/gi, ' ');
  } else if (/\b(?:low\s*floor|low\s*storey|ground\s*floor)\b/i.test(text)) {
    maxFloor = 6;
    text = text.replace(/\b(?:low\s*floor|low\s*storey|ground\s*floor)\b/gi, ' ');
  } else if (/\b(?:mid\s*floor|mid\s*storey)\b/i.test(text)) {
    minFloor = 7;
    maxFloor = 9;
    text = text.replace(/\b(?:mid\s*floor|mid\s*storey)\b/gi, ' ');
  }

  // 3. Detect Town across Singapore 26 official towns (completely case-insensitive & supports aliases)
  for (const item of TOWN_MATCHERS) {
    if (item.pattern.test(text)) {
      detectedTown = item.town;
      text = text.replace(item.pattern, ' ');
      break;
    }
  }

  // 4. Detect Flat Type (completely case-insensitive)
  for (const item of FLAT_TYPE_MATCHERS) {
    if (item.pattern.test(text)) {
      detectedFlatType = item.flatType;
      text = text.replace(item.pattern, ' ');
      break;
    }
  }

  // 5. Detect Year (2017-2026)
  const yearMatch = text.match(/\b(201[7-9]|202[0-6])\b/i);
  if (yearMatch) {
    detectedYear = yearMatch[1];
    text = text.replace(yearMatch[0], ' ');
  }

  // 6. Detect Sort Intent (Lease remaining, Price, Area, PSM, Date)
  let detectedSort: SortOption | undefined;
  if (/\b(?:longest\s*lease|highest\s*lease|fresh\s*lease|newest\s*flat|newest\s*lease|max\s*lease)\b/i.test(text)) {
    detectedSort = 'lease_desc';
    text = text.replace(/\b(?:longest\s*lease|highest\s*lease|fresh\s*lease|newest\s*flat|newest\s*lease|max\s*lease)\b/gi, ' ');
  } else if (/\b(?:shortest\s*lease|lowest\s*lease|oldest\s*lease)\b/i.test(text)) {
    detectedSort = 'lease_asc';
    text = text.replace(/\b(?:shortest\s*lease|lowest\s*lease|oldest\s*lease)\b/gi, ' ');
  } else if (/\b(?:cheapest|lowest\s*price|min\s*price|budget\s*first|price\s*low)\b/i.test(text)) {
    detectedSort = 'price_asc';
    text = text.replace(/\b(?:cheapest|lowest\s*price|min\s*price|budget\s*first|price\s*low)\b/gi, ' ');
  } else if (/\b(?:highest\s*price|most\s*expensive|max\s*price|price\s*high)\b/i.test(text)) {
    detectedSort = 'price_desc';
    text = text.replace(/\b(?:highest\s*price|most\s*expensive|max\s*price|price\s*high)\b/gi, ' ');
  } else if (/\b(?:lowest\s*psm|cheapest\s*psm|lowest\s*psf|best\s*value)\b/i.test(text)) {
    detectedSort = 'psm_asc';
    text = text.replace(/\b(?:lowest\s*psm|cheapest\s*psm|lowest\s*psf|best\s*value)\b/gi, ' ');
  } else if (/\b(?:largest\s*area|biggest\s*flat|largest\s*flat|max\s*area)\b/i.test(text)) {
    detectedSort = 'area_desc';
    text = text.replace(/\b(?:largest\s*area|biggest\s*flat|largest\s*flat|max\s*area)\b/gi, ' ');
  } else if (/\b(?:most\s*recent|latest)\b/i.test(text)) {
    detectedSort = 'date_desc';
    text = text.replace(/\b(?:most\s*recent|latest)\b/gi, ' ');
  }

  // 7. Remaining words / tokens (Street, Block, Model, etc.)
  const cleaned = text
    .replace(/\b(?:blk|block|floor|storey|unit)\b/gi, ' ')
    .trim();

  const keywords = cleaned
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0);

  return {
    raw: trimmed,
    minPrice,
    maxPrice,
    minFloor,
    maxFloor,
    minArea,
    maxArea,
    detectedTown,
    detectedFlatType,
    detectedYear,
    detectedSort,
    keywords,
  };
}

export function filterTransactionMulti(
  tx: HDBTransaction,
  parsed: ParsedSearchQuery
): boolean {
  // 1. Min Price
  if (parsed.minPrice !== undefined && tx.resalePrice < parsed.minPrice) {
    return false;
  }

  // 2. Max Price
  if (parsed.maxPrice !== undefined && tx.resalePrice > parsed.maxPrice) {
    return false;
  }

  // 3. Detected Town
  if (parsed.detectedTown && tx.town.toUpperCase() !== parsed.detectedTown.toUpperCase()) {
    return false;
  }

  // 4. Detected Flat Type
  if (parsed.detectedFlatType && tx.flatType.toUpperCase() !== parsed.detectedFlatType.toUpperCase()) {
    return false;
  }

  // 5. Detected Year
  if (parsed.detectedYear && !tx.transactionMonth.startsWith(parsed.detectedYear)) {
    return false;
  }

  // 6. Floor Level Range
  if (parsed.minFloor !== undefined || parsed.maxFloor !== undefined) {
    const storeyMatch = tx.storeyRange.match(/(\d+)\s*TO\s*(\d+)/i);
    if (storeyMatch) {
      const lowStorey = parseInt(storeyMatch[1], 10);
      const highStorey = parseInt(storeyMatch[2], 10);
      if (parsed.minFloor !== undefined && highStorey < parsed.minFloor) return false;
      if (parsed.maxFloor !== undefined && lowStorey > parsed.maxFloor) return false;
    }
  }

  // 7. Keywords: ALL keywords must match at least one attribute of the transaction (AND logic)
  if (parsed.keywords.length > 0) {
    const searchableBlock = tx.block.toLowerCase();
    const searchableStreet = tx.streetName.toLowerCase();
    const searchableTown = tx.town.toLowerCase();
    const searchableFlatType = tx.flatType.toLowerCase();
    const searchableStorey = tx.storeyRange.toLowerCase();
    const searchableMonth = tx.transactionMonth.toLowerCase();
    const searchableArea = `${tx.floorArea}sqm ${tx.floorArea}`;
    const searchablePrice = `${tx.resalePrice}`;
    const searchablePsm = `${tx.pricePerSqm}`;
    const searchableModel = (tx.flatModel || '').toLowerCase();

    for (const kw of parsed.keywords) {
      const matches =
        searchableBlock.includes(kw) ||
        searchableStreet.includes(kw) ||
        searchableTown.includes(kw) ||
        searchableFlatType.includes(kw) ||
        searchableStorey.includes(kw) ||
        searchableMonth.includes(kw) ||
        searchableArea.includes(kw) ||
        searchablePrice.includes(kw) ||
        searchablePsm.includes(kw) ||
        searchableModel.includes(kw);

      if (!matches) {
        return false;
      }
    }
  }

  return true;
}

// Levenshtein distance for fuzzy matching
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[bn][an];
}

// Normalized string similarity (0.0 to 1.0)
export function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return (maxLen - levenshteinDistance(a.toLowerCase(), b.toLowerCase())) / maxLen;
}

export interface CloseSuggestion {
  id: string;
  label: string;
  description: string;
  type: 'query' | 'town' | 'flatType' | 'year' | 'budget' | 'all';
  actionQuery?: string;
  actionTown?: string;
  actionFlatType?: string;
  actionYear?: string;
}

export function getCloseSuggestions({
  searchQuery,
  parsedQuery,
  selectedTown,
  selectedFlatType,
  selectedYear,
  transactions,
}: {
  searchQuery: string;
  parsedQuery: ParsedSearchQuery;
  selectedTown: string;
  selectedFlatType: string;
  selectedYear: string;
  transactions: HDBTransaction[];
}): CloseSuggestion[] {
  const suggestions: CloseSuggestion[] = [];
  const raw = searchQuery.trim();

  // 1. Check for misspelled Town or close town match from query words
  if (raw) {
    const queryTokens = raw.split(/\s+/);
    for (const token of queryTokens) {
      if (token.length < 3) continue;
      for (const town of SELECTABLE_TOWNS) {
        const sim = stringSimilarity(token, town);
        if (sim >= 0.55 && token.toUpperCase() !== town.toUpperCase()) {
          const replacedQuery = raw.replace(new RegExp(token, 'i'), town);
          suggestions.push({
            id: `sug-town-fuzzy-${town}`,
            label: `Did you mean "${town}"?`,
            description: `Search for ${town} instead of "${token}"`,
            type: 'town',
            actionQuery: replacedQuery,
            actionTown: town,
          });
          break;
        }
      }
    }
  }

  // 2. If user searched another town while viewing a specific town
  if (
    parsedQuery.detectedTown &&
    selectedTown !== 'ALL' &&
    parsedQuery.detectedTown.toUpperCase() !== selectedTown.toUpperCase()
  ) {
    suggestions.push({
      id: `sug-switch-town-${parsedQuery.detectedTown}`,
      label: `Switch town to ${parsedQuery.detectedTown}`,
      description: `Load transactions for ${parsedQuery.detectedTown}`,
      type: 'town',
      actionTown: parsedQuery.detectedTown,
    });
  }

  // 3. Price too low / budget suggestion
  if (parsedQuery.maxPrice !== undefined && transactions.length > 0) {
    const minPrice = Math.min(...transactions.map((t) => t.resalePrice));
    if (parsedQuery.maxPrice < minPrice) {
      const suggestedBudget = Math.ceil(minPrice / 25000) * 25000;
      const newQuery = raw.replace(
        /(?:<|<=|under|below|max)\s*\$?\d+(?:\.\d+)?\s*(?:k|m)?/i,
        `< $${Math.round(suggestedBudget / 1000)}k`
      );
      suggestions.push({
        id: 'sug-budget-increase',
        label: `Adjust budget to < $${Math.round(suggestedBudget / 1000)}k (Lowest is $${minPrice.toLocaleString()})`,
        description: `Expand budget threshold to reach recorded prices`,
        type: 'budget',
        actionQuery: newQuery,
      });
    }
  }

  // 4. Street name suggestions from current transactions
  if (raw && transactions.length > 0) {
    const availableStreets = Array.from(
      new Set(transactions.map((t) => t.streetName))
    );
    const queryTokens = raw.split(/\s+/);
    for (const token of queryTokens) {
      if (token.length < 3) continue;
      for (const st of availableStreets) {
        if (
          st.toLowerCase().includes(token.toLowerCase()) &&
          !raw.toLowerCase().includes(st.toLowerCase())
        ) {
          suggestions.push({
            id: `sug-street-${st}`,
            label: `Try street: "${st}"`,
            description: `Transactions exist on ${st}`,
            type: 'query',
            actionQuery: st,
          });
          if (suggestions.length >= 3) break;
        }
      }
    }
  }

  // 5. Relax flat type restriction if active
  if (selectedFlatType !== 'ALL') {
    suggestions.push({
      id: 'sug-all-flat-types',
      label: `View All Flat Types in ${selectedTown === 'ALL' ? 'Singapore' : selectedTown}`,
      description: `Remove flat type filter`,
      type: 'flatType',
      actionFlatType: 'ALL',
    });
  }

  // 6. Relax year restriction if active
  if (selectedYear !== 'ALL') {
    suggestions.push({
      id: 'sug-all-years',
      label: 'Search All Years (2017 – Present)',
      description: 'Remove year filter',
      type: 'year',
      actionYear: 'ALL',
    });
  }

  // 7. Relax town filter to all towns
  if (selectedTown !== 'ALL') {
    suggestions.push({
      id: 'sug-all-towns',
      label: 'Search across All Towns in Singapore',
      description: 'View transactions in all 26 towns',
      type: 'all',
      actionTown: 'ALL',
    });
  }

  // 8. Clear search query text
  if (raw) {
    suggestions.push({
      id: 'sug-clear-query',
      label: 'Clear search text and view all flats',
      description: 'Reset text filter',
      type: 'query',
      actionQuery: '',
    });
  }

  // Deduplicate and return top 5
  const seen = new Set<string>();
  return suggestions
    .filter((s) => {
      if (seen.has(s.label)) return false;
      seen.add(s.label);
      return true;
    })
    .slice(0, 5);
}

