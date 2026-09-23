import React, { useMemo, useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Maximize2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Calendar,
  RotateCcw,
  Search,
  X,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Quote,
  Clock,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { HDBTransaction, SortOption } from '../types';
import {
  AVAILABLE_TOWNS,
  AVAILABLE_FLAT_TYPES,
  AVAILABLE_YEARS,
} from '../data/hdbData';
import {
  calculateMedian,
  formatSGD,
  formatCompactSGD,
  formatMonth,
} from '../utils/calculations';
import { PriceTrendChart } from './PriceTrendChart';
import { DataStateMessage, DataStatus } from './DataStateMessage';
import { HdbFetchError } from '../services/hdbApi';
import { SearchableDropdown } from './SearchableDropdown';
import {
  parseMultiSearchQuery,
  filterTransactionMulti,
  POPULAR_SEARCH_PRESETS,
  getCloseSuggestions,
  CloseSuggestion,
} from '../utils/multiSearch';

interface ExplorePricesProps {
  transactions: HDBTransaction[];
  selectedTown: string;
  selectedFlatType: string;
  onTownChange: (town: string) => void;
  onFlatTypeChange: (flatType: string) => void;
  onSelectTransaction: (tx: HDBTransaction) => void;
  dataStatus?: DataStatus;
  fetchError?: HdbFetchError | null;
  onRetry?: () => void;
  onResetFilters?: () => void;
}

export const ExplorePrices: React.FC<ExplorePricesProps> = ({
  transactions,
  selectedTown,
  selectedFlatType,
  onTownChange,
  onFlatTypeChange,
  onSelectTransaction,
  dataStatus = 'success',
  fetchError = null,
  onRetry,
  onResetFilters,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const parsedQuery = useMemo(
    () => parseMultiSearchQuery(searchQuery),
    [searchQuery]
  );

  // Automatically load data when a valid town, flat type, or year matches in the search query
  // (no manual button click or detected option choice required!)
  useEffect(() => {
    if (
      parsedQuery.detectedTown &&
      parsedQuery.detectedTown.toUpperCase() !== selectedTown.toUpperCase()
    ) {
      onTownChange(parsedQuery.detectedTown);
    }
  }, [parsedQuery.detectedTown, selectedTown, onTownChange]);

  useEffect(() => {
    if (
      parsedQuery.detectedFlatType &&
      parsedQuery.detectedFlatType.toUpperCase() !== selectedFlatType.toUpperCase()
    ) {
      onFlatTypeChange(parsedQuery.detectedFlatType);
    }
  }, [parsedQuery.detectedFlatType, selectedFlatType, onFlatTypeChange]);

  useEffect(() => {
    if (
      parsedQuery.detectedYear &&
      parsedQuery.detectedYear !== selectedYear
    ) {
      setSelectedYear(parsedQuery.detectedYear);
    }
  }, [parsedQuery.detectedYear, selectedYear]);

  // Auto-apply sort if detected from search query keywords (e.g. "longest lease", "cheapest")
  useEffect(() => {
    if (parsedQuery.detectedSort && parsedQuery.detectedSort !== sortBy) {
      setSortBy(parsedQuery.detectedSort);
    }
  }, [parsedQuery.detectedSort, sortBy]);

  // Filter transactions with case-insensitive multi-criteria matching
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchTown =
        selectedTown.toUpperCase() === 'ALL' ||
        tx.town.toUpperCase() === selectedTown.toUpperCase();
      const matchType =
        selectedFlatType.toUpperCase() === 'ALL' ||
        tx.flatType.toUpperCase() === selectedFlatType.toUpperCase();
      const matchYear =
        selectedYear === 'ALL' ||
        tx.transactionMonth.startsWith(selectedYear);
      if (!matchTown || !matchType || !matchYear) return false;

      if (searchQuery.trim()) {
        return filterTransactionMulti(tx, parsedQuery);
      }

      return true;
    });
  }, [transactions, selectedTown, selectedFlatType, selectedYear, searchQuery, parsedQuery]);

  // Sort transactions by date, remaining lease, price, price/sqm, or floor area
  const sortedTransactions = useMemo(() => {
    const list = [...filteredTransactions];
    switch (sortBy) {
      case 'date_desc':
        return list.sort((a, b) => b.transactionMonth.localeCompare(a.transactionMonth) || b.resalePrice - a.resalePrice);
      case 'date_asc':
        return list.sort((a, b) => a.transactionMonth.localeCompare(b.transactionMonth) || a.resalePrice - b.resalePrice);
      case 'lease_desc':
        return list.sort((a, b) => (b.remainingLeaseYears || 0) - (a.remainingLeaseYears || 0) || b.transactionMonth.localeCompare(a.transactionMonth));
      case 'lease_asc':
        return list.sort((a, b) => (a.remainingLeaseYears || 0) - (b.remainingLeaseYears || 0) || b.transactionMonth.localeCompare(a.transactionMonth));
      case 'price_asc':
        return list.sort((a, b) => a.resalePrice - b.resalePrice || b.transactionMonth.localeCompare(a.transactionMonth));
      case 'price_desc':
        return list.sort((a, b) => b.resalePrice - a.resalePrice || b.transactionMonth.localeCompare(a.transactionMonth));
      case 'psm_asc':
        return list.sort((a, b) => (a.pricePerSqm || 0) - (b.pricePerSqm || 0) || a.resalePrice - b.resalePrice);
      case 'psm_desc':
        return list.sort((a, b) => (b.pricePerSqm || 0) - (a.pricePerSqm || 0) || b.resalePrice - a.resalePrice);
      case 'area_desc':
        return list.sort((a, b) => b.floorArea - a.floorArea || b.resalePrice - a.resalePrice);
      case 'area_asc':
        return list.sort((a, b) => a.floorArea - b.floorArea || a.resalePrice - b.resalePrice);
      default:
        return list;
    }
  }, [filteredTransactions, sortBy]);

  // Determine if any match was found (during loading, do not prematurely display 'no results')
  const hasMatches = dataStatus === 'loading' || filteredTransactions.length > 0;

  // Compute close suggestions when there are no matches
  const closeSuggestions = useMemo(() => {
    if (hasMatches) return [];
    return getCloseSuggestions({
      searchQuery,
      parsedQuery,
      selectedTown,
      selectedFlatType,
      selectedYear,
      transactions,
    });
  }, [
    hasMatches,
    searchQuery,
    parsedQuery,
    selectedTown,
    selectedFlatType,
    selectedYear,
    transactions,
  ]);

  // Handler to apply a close suggestion
  const handleApplySuggestion = (sug: CloseSuggestion) => {
    if (sug.actionQuery !== undefined) setSearchQuery(sug.actionQuery);
    if (sug.actionTown !== undefined) onTownChange(sug.actionTown);
    if (sug.actionFlatType !== undefined) onFlatTypeChange(sug.actionFlatType);
    if (sug.actionYear !== undefined) setSelectedYear(sug.actionYear);
  };

  // Pagination configuration (capped at 30 flats per page)
  const PAGE_SIZE = 30;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page whenever filters, sorting, or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTown, selectedFlatType, selectedYear, sortBy, searchQuery]);

  const totalPages = Math.ceil(sortedTransactions.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, sortedTransactions.length);

  const paginatedTransactions = useMemo(() => {
    return sortedTransactions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedTransactions, startIndex]);

  // Key Summary Information
  const prices = useMemo(() => filteredTransactions.map((t) => t.resalePrice), [filteredTransactions]);
  const medianPrice = useMemo(() => calculateMedian(prices), [prices]);
  const highestPrice = useMemo(() => (prices.length ? Math.max(...prices) : 0), [prices]);
  const lowestPrice = useMemo(() => (prices.length ? Math.min(...prices) : 0), [prices]);
  const transactionCount = filteredTransactions.length;

  const isFiltered =
    selectedTown !== 'ALL' ||
    selectedFlatType !== 'ALL' ||
    selectedYear !== 'ALL' ||
    searchQuery.trim().length > 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Page Title & Intro */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Explore HDB Resale Prices (2017 – Present)
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          Every resale flat transaction recorded from January 2017 until present time. Filter by town, year, and flat type to analyze valuations, price movements, and comparable sales.
        </p>
      </div>

      {/* Filter Controls Card with Top Multi-Function Search */}
      <section
        id="filter-controls-section"
        aria-label="Filter Controls"
        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Filter Transactions</span>
          </div>

          <div className="flex items-center gap-3">
            {!hasMatches && (
              <span
                id="filter-card-no-results-error"
                className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1"
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                No results found.
              </span>
            )}

            {isFiltered && (
              <button
                id="btn-reset-filters"
                type="button"
                onClick={() => {
                  onTownChange('ALL');
                  onFlatTypeChange('ALL');
                  setSelectedYear('ALL');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* Multi-Function Omni-Search Bar (Directly on top of dropdowns) */}
        {/* ======================================================== */}
        <div
          id="multi-function-search-box"
          className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-3 sm:p-3.5 space-y-2.5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <label
              htmlFor="input-multi-search"
              className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-slate-700" />
              <span>Multi-Function Search</span>
              <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 hidden sm:inline-block">
                street, block, town, flat type, budget or floor in one go
              </span>
            </label>

            {/* Error function in red text on the top right if no match */}
            {!hasMatches ? (
              <div
                id="search-header-error-top-right"
                className="flex items-center gap-1.5 text-right"
              >
                <span className="text-xs sm:text-sm font-bold text-red-600 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  No results found.
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-600">
                {filteredTransactions.length} matching transaction
                {filteredTransactions.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* Search Input Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="input-multi-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search multiple functions in one go: street, block, town, flat type, budget or floor (e.g. 'Tampines 4 Room 245', '<550k', 'Bishan high floor')..."
              className="w-full h-11 pl-10 pr-20 bg-white border border-slate-300 focus:border-slate-900 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition-all shadow-2xs"
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <button
                  id="btn-clear-search"
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                  title="Clear search query"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* No Match Error Box with Reference to Quote & Close Suggestions */}
          {/* ======================================================== */}
          {!hasMatches && (
            <div
              id="no-match-feedback-panel"
              role="region"
              aria-label="No Results Information and Suggestions"
              className="bg-red-50/60 border border-red-200/90 rounded-xl p-3.5 space-y-3 mt-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1 border-b border-red-200/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>No results found.</span>
                </div>
                <div className="text-[11px] font-medium text-slate-600 italic">
                  Reference quote: &ldquo;{searchQuery || `${selectedTown} · ${selectedFlatType} · ${selectedYear}`}&rdquo;
                </div>
              </div>

              {/* Official HDB Dataset Reference Quote */}
              <blockquote className="bg-white/85 border-l-2 border-red-500 pl-3 pr-2.5 py-2 rounded-r-lg text-xs text-slate-700 italic space-y-1">
                <p>
                  &ldquo;No official resale transactions recorded in the data.gov.sg dataset match your query: &lsquo;{searchQuery || `${selectedTown} ${selectedFlatType}`}&rsquo; under {selectedTown === 'ALL' ? 'Singapore' : selectedTown} ({selectedFlatType}).&rdquo;
                </p>
                <cite className="block not-italic text-[10px] font-semibold text-slate-500">
                  &mdash; Housing &amp; Development Board (HDB) Resale Flat Prices Official Dataset (Resource ID: d_8b84c4ee58e3cfc0ece0d773c8ca6abc)
                </cite>
              </blockquote>

              {/* Close Suggestions that are close to what was searched */}
              {closeSuggestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Close Suggestions (Click to apply):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {closeSuggestions.map((sug) => (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => handleApplySuggestion(sug)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-950 border border-slate-300 hover:border-amber-300 text-xs font-semibold cursor-pointer transition-all shadow-2xs group"
                        title={sug.description}
                      >
                        <span>{sug.label}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-700 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parsed Function Badges */}
          {(parsedQuery.detectedTown ||
            parsedQuery.detectedFlatType ||
            parsedQuery.minPrice !== undefined ||
            parsedQuery.maxPrice !== undefined ||
            parsedQuery.minFloor !== undefined ||
            parsedQuery.maxFloor !== undefined ||
            parsedQuery.detectedYear) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Detected:
              </span>
              {parsedQuery.detectedTown && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                  📍 Town: {parsedQuery.detectedTown}
                </span>
              )}
              {parsedQuery.detectedFlatType && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  🏠 {parsedQuery.detectedFlatType}
                </span>
              )}
              {(parsedQuery.minPrice !== undefined || parsedQuery.maxPrice !== undefined) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  💰{' '}
                  {parsedQuery.minPrice && parsedQuery.maxPrice
                    ? `${formatCompactSGD(parsedQuery.minPrice)} – ${formatCompactSGD(parsedQuery.maxPrice)}`
                    : parsedQuery.maxPrice
                    ? `< ${formatCompactSGD(parsedQuery.maxPrice)}`
                    : `> ${formatCompactSGD(parsedQuery.minPrice!)}`}
                </span>
              )}
              {(parsedQuery.minFloor !== undefined || parsedQuery.maxFloor !== undefined) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
                  🏢 {parsedQuery.minFloor && parsedQuery.minFloor >= 10 ? 'High Floor (10+)' : 'Specific Floor Level'}
                </span>
              )}
              {parsedQuery.detectedYear && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                  📅 Year {parsedQuery.detectedYear}
                </span>
              )}

              {/* Auto-loaded indicator confirming data has been automatically loaded */}
              {(parsedQuery.detectedTown || parsedQuery.detectedFlatType) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-semibold text-xs ml-1 shadow-2xs">
                  ✓ Auto-loaded {parsedQuery.detectedTown || selectedTown}
                  {parsedQuery.detectedFlatType ? ` (${parsedQuery.detectedFlatType})` : ''}
                </span>
              )}
            </div>
          )}

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Popular Presets:
            </span>
            {POPULAR_SEARCH_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSearchQuery(preset.query)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  searchQuery === preset.query
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Town Filter with integrated top search inside dropdown */}
          <div>
            <SearchableDropdown
              id="select-town"
              label="Town / Location"
              value={selectedTown}
              options={AVAILABLE_TOWNS.map((t) => ({
                value: t,
                label: t === 'ALL' ? 'All Towns across Singapore' : t,
                sublabel: t === 'ALL' ? 'View all 26 towns' : undefined,
              }))}
              onChange={onTownChange}
              searchPlaceholder="Search 26 towns in Singapore (e.g. Bishan, Bedok)..."
            />
          </div>

          {/* Year Filter (from 2017 to Present) */}
          <div>
            <label htmlFor="select-year" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Transaction Year</span>
            </label>
            <select
              id="select-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer"
            >
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y === 'ALL' ? 'All Years (2017 – Present)' : y === '2026' ? '2026 (Present)' : y}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label htmlFor="select-sort" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sort Transactions By
            </label>
            <select
              id="select-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer"
            >
              <optgroup label="Transaction Date">
                <option value="date_desc">📅 Most Recent Month First</option>
                <option value="date_asc">📅 Oldest Month First (from 2017)</option>
              </optgroup>
              <optgroup label="Remaining Lease">
                <option value="lease_desc">⏳ Remaining Lease: Longest First (Newest)</option>
                <option value="lease_asc">⏳ Remaining Lease: Shortest First</option>
              </optgroup>
              <optgroup label="Resale Price">
                <option value="price_asc">💰 Price: Low to High (Cheapest First)</option>
                <option value="price_desc">💰 Price: High to Low (Most Expensive)</option>
                <option value="psm_asc">📊 Price / Sqm: Lowest First</option>
                <option value="psm_desc">📊 Price / Sqm: Highest First</option>
              </optgroup>
              <optgroup label="Floor Area">
                <option value="area_desc">📐 Floor Area: Largest First</option>
                <option value="area_asc">📐 Floor Area: Smallest First</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Flat Type Filter Chips */}
        <div>
          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Flat Type
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Flat Type Selection">
            {AVAILABLE_FLAT_TYPES.map((type) => {
              const isActive = selectedFlatType === type;
              return (
                <button
                  key={type}
                  id={`filter-flat-${type.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => onFlatTypeChange(type)}
                  type="button"
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {type === 'ALL' ? 'All Flat Types' : type}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upstream Status Messages: Loading, Refused, Unreachable, or Empty */}
      {dataStatus === 'loading' && (
        <DataStateMessage status="loading" />
      )}

      {dataStatus === 'refused' && (
        <DataStateMessage
          status="refused"
          error={fetchError}
          onRetry={onRetry}
        />
      )}

      {dataStatus === 'unreachable' && (
        <DataStateMessage
          status="unreachable"
          error={fetchError}
          onRetry={onRetry}
        />
      )}

      {(dataStatus === 'empty' || (dataStatus === 'success' && transactionCount === 0)) && (
        <DataStateMessage
          status="empty"
          onResetFilters={onResetFilters}
        />
      )}

      {/* When loading with no records or during error states with no records, pause rendering empty charts */}
      {((dataStatus === 'loading' && transactionCount === 0) ||
        dataStatus === 'refused' ||
        dataStatus === 'unreachable' ||
        transactionCount === 0) ? null : (
        <>
          {/* Key Summary Information - 4 Metrics */}
          <section aria-label="Key Summary Information">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Key Summary Information
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Based on {transactionCount} recorded transactions ({selectedYear === 'ALL' ? '2017 – Present' : selectedYear})
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Median Resale Price */}
          <div
            id="summary-median-price"
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1.5">
              <span>Median Resale Price</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {transactionCount > 0 ? formatSGD(medianPrice) : '—'}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Midpoint valuation for selected flats
            </div>
          </div>

          {/* Number of Transactions */}
          <div
            id="summary-tx-count"
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1.5">
              <span>Transactions</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {transactionCount}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Recorded resale transactions
            </div>
          </div>

          {/* Highest Transaction Price */}
          <div
            id="summary-highest-price"
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1.5">
              <span>Highest Price</span>
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {transactionCount > 0 ? formatSGD(highestPrice) : '—'}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Top recorded sale in filter
            </div>
          </div>

          {/* Lowest Transaction Price */}
          <div
            id="summary-lowest-price"
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1.5">
              <span>Lowest Price</span>
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {transactionCount > 0 ? formatSGD(lowestPrice) : '—'}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Most accessible entry sale
            </div>
          </div>
        </div>
      </section>

      {/* Price Trend Chart with Yearly default and timeframe options */}
      <section aria-label="Price Trend Chart">
        <PriceTrendChart
          transactions={filteredTransactions}
          town={selectedTown}
          flatType={selectedFlatType}
        />
      </section>

      {/* Recent Resale Transactions List */}
      <section aria-label="Recent Resale Transactions List" id="recent-transactions-section">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h3 id="recent-transactions-heading" className="text-base sm:text-lg font-bold text-slate-900">
                Resale Flat Transactions (2017 – Present)
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                {sortedTransactions.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {sortedTransactions.length > PAGE_SIZE ? (
                <>
                  Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{sortedTransactions.length}</strong> recorded flats (capped at 30 per page).
                </>
              ) : (
                <>
                  Showing <strong>{sortedTransactions.length}</strong> recorded flats from 2017 until present time.
                </>
              )}{' '}
              Tap any transaction to inspect details & comparable sales.
            </p>
          </div>

          {!hasMatches ? (
            <span className="text-xs sm:text-sm font-bold text-red-600 flex items-center gap-1 animate-pulse">
              <AlertCircle className="w-4 h-4 text-red-600" />
              No results found.
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <label htmlFor="transactions-sort-select" className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Sort by:</span>
              </label>
              <select
                id="transactions-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort resale flat transactions"
                className="h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-slate-900 focus:outline-hidden cursor-pointer"
              >
                <optgroup label="Transaction Date">
                  <option value="date_desc">📅 Most Recent Month First</option>
                  <option value="date_asc">📅 Oldest Month First (from 2017)</option>
                </optgroup>
                <optgroup label="Remaining Lease">
                  <option value="lease_desc">⏳ Remaining Lease: Longest First (Newest)</option>
                  <option value="lease_asc">⏳ Remaining Lease: Shortest First</option>
                </optgroup>
                <optgroup label="Resale Price">
                  <option value="price_asc">💰 Price: Low to High (Cheapest)</option>
                  <option value="price_desc">💰 Price: High to Low (Most Expensive)</option>
                  <option value="psm_asc">📊 Price / Sqm: Lowest First</option>
                  <option value="psm_desc">📊 Price / Sqm: Highest First</option>
                </optgroup>
                <optgroup label="Floor Area">
                  <option value="area_desc">📐 Floor Area: Largest First</option>
                  <option value="area_asc">📐 Floor Area: Smallest First</option>
                </optgroup>
              </select>
            </div>
          )}
        </div>

        {/* Quick Sort Options Bar */}
        {hasMatches && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1" role="toolbar" aria-label="Quick sort options">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Quick Sort:
            </span>
            <button
              type="button"
              onClick={() => setSortBy('date_desc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                sortBy === 'date_desc'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Most Recent</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy('lease_desc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                sortBy === 'lease_desc'
                  ? 'bg-emerald-900 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Longest Lease</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy('lease_asc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                sortBy === 'lease_asc'
                  ? 'bg-emerald-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Shortest Lease</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy('price_asc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                sortBy === 'price_asc'
                  ? 'bg-amber-900 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>Lowest Price</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy('price_desc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                sortBy === 'price_desc'
                  ? 'bg-amber-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Highest Price</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy('psm_asc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                sortBy === 'psm_asc'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Lowest $/sqm</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy('area_desc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                sortBy === 'area_desc'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>Largest Area</span>
            </button>
          </div>
        )}

        {sortedTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-red-200/80 p-6 sm:p-8 text-center text-slate-700 space-y-4 shadow-xs">
            <div className="inline-flex p-3 rounded-full bg-red-100 text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-bold text-red-600">
                No results found.
              </h4>
              <p className="text-xs text-slate-500 italic">
                Reference quote: &ldquo;{searchQuery || `${selectedTown} · ${selectedFlatType} · ${selectedYear}`}&rdquo;
              </p>
            </div>

            <blockquote className="bg-slate-50 border-l-2 border-red-400 p-3 rounded-r-lg max-w-xl mx-auto text-xs text-slate-600 italic">
              &ldquo;No resale transactions match this specific search query in official Housing &amp; Development Board records.&rdquo;
              <cite className="block not-italic text-[10px] font-semibold text-slate-400 mt-1">
                &mdash; data.gov.sg HDB Resale Flat Prices Dataset (Housing &amp; Development Board)
              </cite>
            </blockquote>

            {closeSuggestions.length > 0 && (
              <div className="pt-2 max-w-xl mx-auto space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Close Suggestions:
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {closeSuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => handleApplySuggestion(sug)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onTownChange('ALL');
                  onFlatTypeChange('ALL');
                  setSelectedYear('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {paginatedTransactions.map((tx) => (
              <div
                key={tx.id}
                id={`tx-row-${tx.id}`}
                onClick={() => onSelectTransaction(tx)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTransaction(tx);
                  }
                }}
              >
                <div className="space-y-1 sm:max-w-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                      {tx.town}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {tx.flatType}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Storey {tx.storeyRange}
                    </span>
                  </div>

                  <div className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                    Blk {tx.block} {tx.streetName}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {sortBy === 'area_desc' || sortBy === 'area_asc' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-blue-950 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">
                        {tx.floorArea} sqm (~{Math.round(tx.floorArea * 10.764)} sqft)
                      </span>
                    ) : (
                      <span>{tx.floorArea} sqm (~{Math.round(tx.floorArea * 10.764)} sqft)</span>
                    )}

                    <span>•</span>

                    {sortBy === 'lease_desc' || sortBy === 'lease_asc' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                        <Clock className="w-3 h-3 text-emerald-700" />
                        Lease: {tx.remainingLeaseYears} yrs
                      </span>
                    ) : (
                      <span>Lease: {tx.remainingLeaseYears} yrs</span>
                    )}

                    <span>•</span>

                    {sortBy === 'date_desc' || sortBy === 'date_asc' ? (
                      <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                        {formatMonth(tx.transactionMonth)}
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-700">{formatMonth(tx.transactionMonth)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div
                      className={`text-base sm:text-lg font-black tracking-tight ${
                        sortBy === 'price_asc' || sortBy === 'price_desc'
                          ? 'text-amber-950 font-black'
                          : 'text-slate-900'
                      }`}
                    >
                      {formatSGD(tx.resalePrice)}
                    </div>
                    {sortBy === 'psm_asc' || sortBy === 'psm_desc' ? (
                      <div className="text-xs font-bold text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 inline-block mt-0.5">
                        {formatSGD(tx.pricePerSqm)} / sqm
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-slate-500">
                        {formatSGD(tx.pricePerSqm)} / sqm
                      </div>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-amber-100 group-hover:text-amber-900 flex items-center justify-center text-slate-400 transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {sortedTransactions.length > PAGE_SIZE && (
          <div
            id="pagination-controls"
            aria-label="Pagination Controls"
            className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mt-4"
          >
            <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
              Showing page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong> (capped at 30 items per page)
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-pagination-prev"
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors min-h-[44px] cursor-pointer ${
                  currentPage === 1
                    ? 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-bold text-slate-800 px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                id="btn-pagination-next"
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors min-h-[44px] cursor-pointer ${
                  currentPage === totalPages
                    ? 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
};
