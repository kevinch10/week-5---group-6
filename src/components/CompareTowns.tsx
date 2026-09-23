import React, { useMemo, useState } from 'react';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  ArrowRight,
  ArrowLeftRight,
  Info,
  DollarSign,
  Maximize2,
  Layers,
} from 'lucide-react';
import { HDBTransaction, TownSummary } from '../types';
import { AVAILABLE_TOWNS } from '../data/hdbData';
import { fetchLiveTransactions } from '../services/hdbApi';
import {
  computeTownSummary,
  formatSGD,
  formatCompactSGD,
} from '../utils/calculations';
import { SearchableDropdown } from './SearchableDropdown';

interface CompareTownsProps {
  transactions: HDBTransaction[];
  onExploreTown: (town: string) => void;
}

// Non-'ALL' towns
const SELECTABLE_TOWNS = AVAILABLE_TOWNS.filter((t) => t !== 'ALL');

export const CompareTowns: React.FC<CompareTownsProps> = ({
  transactions,
  onExploreTown,
}) => {
  // Strictly compare between two towns
  const [townA, setTownA] = useState<string>('TAMPINES');
  const [townB, setTownB] = useState<string>('PUNGGOL');

  // Dynamic cache of fetched town transactions for side-by-side comparison
  const [dynamicTownData, setDynamicTownData] = useState<Record<string, HDBTransaction[]>>({});
  const [loadingTowns, setLoadingTowns] = useState<Record<string, boolean>>({});

  // Fetch town transactions if not already in parent transactions or local dynamicTownData
  React.useEffect(() => {
    const townsToCheck = [townA, townB];
    townsToCheck.forEach((t) => {
      const hasInProps = transactions.some((tx) => tx.town === t);
      const hasInDynamic = !!dynamicTownData[t];
      const isLoading = !!loadingTowns[t];

      if (!hasInProps && !hasInDynamic && !isLoading) {
        setLoadingTowns((prev) => ({ ...prev, [t]: true }));
        fetchLiveTransactions(t, 'ALL')
          .then((res) => {
            setDynamicTownData((prev) => ({ ...prev, [t]: res.transactions }));
          })
          .catch((err) => {
            console.warn(`Failed to load comparison data for ${t}:`, err);
          })
          .finally(() => {
            setLoadingTowns((prev) => ({ ...prev, [t]: false }));
          });
      }
    });
  }, [townA, townB, transactions, dynamicTownData, loadingTowns]);

  const activeTransactions = useMemo(() => {
    const dynamicList = (Object.values(dynamicTownData) as HDBTransaction[][]).flat();
    if (dynamicList.length === 0) return transactions;
    const existingIds = new Set(transactions.map((t) => t.id));
    const newItems = dynamicList.filter((t) => !existingIds.has(t.id));
    return [...transactions, ...newItems];
  }, [transactions, dynamicTownData]);

  const swapTowns = () => {
    setTownA(townB);
    setTownB(townA);
  };

  const handleTownAChange = (newTown: string) => {
    if (newTown === townB) {
      // If user picks same town as Town B, swap them
      setTownB(townA);
    }
    setTownA(newTown);
  };

  const handleTownBChange = (newTown: string) => {
    if (newTown === townA) {
      // If user picks same town as Town A, swap them
      setTownA(townB);
    }
    setTownB(newTown);
  };

  // Compute stats for both selected towns
  const statsA: TownSummary = useMemo(() => {
    return computeTownSummary(townA, activeTransactions);
  }, [townA, activeTransactions]);

  const statsB: TownSummary = useMemo(() => {
    return computeTownSummary(townB, activeTransactions);
  }, [townB, activeTransactions]);

  const townStats = useMemo(() => [statsA, statsB], [statsA, statsB]);

  // Head-to-head comparative analysis
  const comparisonInsights = useMemo(() => {
    const priceDiff = statsA.medianPrice - statsB.medianPrice;
    const psmDiff = statsA.avgPricePerSqm - statsB.avgPricePerSqm;
    const cheaperTown = priceDiff < 0 ? statsA.town : statsB.town;
    const expensiveTown = priceDiff < 0 ? statsB.town : statsA.town;
    const priceGap = Math.abs(priceDiff);
    const gapPercent = Math.round(
      (priceGap / Math.min(statsA.medianPrice, statsB.medianPrice || 1)) * 100
    );

    return {
      priceDiff,
      psmDiff,
      cheaperTown,
      expensiveTown,
      priceGap,
      gapPercent,
      higherGrowthTown:
        statsA.priceChangePercent > statsB.priceChangePercent
          ? statsA.town
          : statsB.priceChangePercent > statsA.priceChangePercent
          ? statsB.town
          : null,
    };
  }, [statsA, statsB]);

  // Max values for comparison chart bars
  const maxMedian = Math.max(statsA.medianPrice, statsB.medianPrice, 1);
  const maxPsm = Math.max(statsA.avgPricePerSqm, statsB.avgPricePerSqm, 1);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Compare Two HDB Towns Side by Side
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          Select two towns to directly compare median resale prices, cost per square metre, transaction volume, and price growth from 2017 until present time.
        </p>
      </div>

      {/* Two-Town Selector */}
      <section
        id="town-selector-section"
        aria-label="Two Town Selector"
        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span>Choose Two Towns to Compare</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
          {/* Town 1 Dropdown with top search */}
          <div>
            <SearchableDropdown
              id="select-town-a"
              label="First Town"
              value={townA}
              options={SELECTABLE_TOWNS.map((town) => ({
                value: town,
                label: town,
              }))}
              onChange={handleTownAChange}
              searchPlaceholder="Search 26 towns in Singapore..."
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:pt-6">
            <button
              id="swap-towns-button"
              type="button"
              onClick={swapTowns}
              className="inline-flex items-center justify-center gap-1.5 px-4 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
              title="Swap Towns"
              aria-label="Swap Selected Towns"
            >
              <ArrowLeftRight className="w-4 h-4 text-slate-600" />
              <span className="md:hidden">Swap Towns</span>
            </button>
          </div>

          {/* Town 2 Dropdown with top search */}
          <div>
            <SearchableDropdown
              id="select-town-b"
              label="Second Town"
              value={townB}
              options={SELECTABLE_TOWNS.map((town) => ({
                value: town,
                label: town,
              }))}
              onChange={handleTownBChange}
              searchPlaceholder="Search 26 towns in Singapore..."
            />
          </div>
        </div>
      </section>

      {/* Head-to-Head Takeaway Verdict Banner */}
      <section
        id="comparative-verdict-banner"
        aria-label="Comparative Takeaways"
        className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 text-slate-900"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              Direct Comparison Verdict: {statsA.town} vs {statsB.town}
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {comparisonInsights.priceGap === 0 ? (
                <>
                  Both <strong>{statsA.town}</strong> and <strong>{statsB.town}</strong> share identical median resale prices at{' '}
                  <strong className="text-slate-900">{formatSGD(statsA.medianPrice)}</strong>.
                </>
              ) : (
                <>
                  <strong>{comparisonInsights.cheaperTown}</strong> is more affordable with a median resale price of{' '}
                  <strong className="text-slate-900">{formatSGD(Math.min(statsA.medianPrice, statsB.medianPrice))}</strong>, while{' '}
                  <strong>{comparisonInsights.expensiveTown}</strong> commands a premium of{' '}
                  <strong className="text-slate-900">{formatSGD(comparisonInsights.priceGap)}</strong> ({comparisonInsights.gapPercent}% higher).
                </>
              )}{' '}
              {comparisonInsights.higherGrowthTown ? (
                <span>
                  <strong>{comparisonInsights.higherGrowthTown}</strong> demonstrated higher recent price appreciation.
                </span>
              ) : (
                <span>Price movements across both towns have tracked closely.</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Side-by-Side Town Metric Cards */}
      <section aria-label="Side by Side Town Cards">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Side-by-Side Town Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {townStats.map((town, index) => {
            const isFirst = index === 0;
            const otherTown = isFirst ? statsB : statsA;
            const isCheaper = town.medianPrice < otherTown.medianPrice;
            const isPricier = town.medianPrice > otherTown.medianPrice;

            return (
              <div
                key={town.town}
                id={`compare-card-${town.town.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Town Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isFirst ? 'First Town' : 'Second Town'}
                      </span>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                          {town.town}
                        </h4>
                        {loadingTowns[town.town] && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                            Loading...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tag badge */}
                    {isCheaper && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Lower Entry Price
                      </span>
                    )}
                    {isPricier && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                        Higher Valuation
                      </span>
                    )}
                  </div>

                  {/* Metrics Stack */}
                  <div className="space-y-4">
                    {/* 1. Median Resale Price */}
                    <div>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-0.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span>Median Resale Price</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {formatSGD(town.medianPrice)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Range: {formatCompactSGD(town.lowestPrice)} – {formatCompactSGD(town.highestPrice)}
                      </div>
                    </div>

                    {/* 2. Average Price Per Square Metre */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-0.5">
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Average Price / sqm</span>
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-slate-900">
                        {formatSGD(town.avgPricePerSqm)} <span className="text-xs text-slate-500 font-normal">/ sqm</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        ~{formatSGD(Math.round(town.avgPricePerSqm / 10.764))} / sqft
                      </div>
                    </div>

                    {/* 3. Number of Transactions */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-0.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Recorded Transactions</span>
                      </div>
                      <div className="text-base sm:text-lg font-bold text-slate-900">
                        {town.transactionCount} transactions
                      </div>
                    </div>

                    {/* 4. Price Change Since 2017 */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500 font-medium mb-1">
                        Price Growth Since 2017
                      </div>
                      <div className="flex items-center gap-2">
                        {town.priceChangePercent > 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <TrendingUp className="w-3.5 h-3.5" />
                            +{town.priceChangePercent}%
                          </span>
                        ) : town.priceChangePercent < -1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {town.priceChangePercent}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Minus className="w-3.5 h-3.5" />
                            {town.priceChangePercent >= 0 ? '+' : ''}{town.priceChangePercent}% (Stable)
                          </span>
                        )}
                        <span className="text-xs text-slate-500">vs 2017 baseline</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <button
                  type="button"
                  onClick={() => onExploreTown(town.town)}
                  className="mt-6 w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <span>Explore {town.town} Flats</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Simple Comparison Chart */}
      <section
        id="simple-comparison-chart-section"
        aria-label="Simple Comparison Chart"
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6"
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-slate-700" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Visual Comparison Chart: {statsA.town} vs {statsB.town}
            </h3>
            <p className="text-xs text-slate-500">
              Compare median resale price and average price per square metre at a glance
            </p>
          </div>
        </div>

        {/* Bar Comparison: Median Resale Price */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Median Resale Price (SGD)</span>
            <span className="text-slate-500 font-normal">Higher is more expensive</span>
          </div>

          <div className="space-y-3">
            {townStats.map((town, idx) => {
              const widthPct = Math.round((town.medianPrice / maxMedian) * 100);
              const barColor = idx === 0 ? 'bg-slate-900 text-white' : 'bg-slate-700 text-white';

              return (
                <div key={`chart-median-${town.town}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{town.town}</span>
                    <span className="font-bold text-slate-900">{formatSGD(town.medianPrice)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-7 p-1 overflow-hidden">
                    <div
                      className={`${barColor} h-full rounded-full transition-all duration-500 flex items-center px-3 justify-end text-[11px] font-bold shadow-xs`}
                      style={{ width: `${Math.max(widthPct, 18)}%` }}
                    >
                      {formatCompactSGD(town.medianPrice)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar Comparison: Avg Price Per Sqm */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Average Price Per Square Metre ($/sqm)</span>
            <span className="text-slate-500 font-normal">Land & space efficiency value</span>
          </div>

          <div className="space-y-3">
            {townStats.map((town) => {
              const widthPct = Math.round((town.avgPricePerSqm / maxPsm) * 100);
              return (
                <div key={`chart-psm-${town.town}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{town.town}</span>
                    <span className="font-bold text-slate-900">{formatSGD(town.avgPricePerSqm)}/sqm</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-7 p-1 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500 flex items-center px-3 justify-end text-[11px] font-bold text-slate-950 shadow-xs"
                      style={{ width: `${Math.max(widthPct, 18)}%` }}
                    >
                      {formatSGD(town.avgPricePerSqm)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
