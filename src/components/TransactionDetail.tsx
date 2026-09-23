import React, { useMemo } from 'react';
import {
  ArrowLeft,
  Building,
  Maximize2,
  Clock,
  Calendar,
  Layers,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { HDBTransaction } from '../types';
import {
  evaluateTransactionValue,
  formatSGD,
  formatCompactSGD,
  formatMonth,
} from '../utils/calculations';

interface TransactionDetailProps {
  transaction: HDBTransaction;
  allTransactions: HDBTransaction[];
  onBack: () => void;
  onSelectTransaction: (tx: HDBTransaction) => void;
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({
  transaction,
  allTransactions,
  onBack,
  onSelectTransaction,
}) => {
  // Value evaluation relative to peers in same town & flat type
  const evaluation = useMemo(() => {
    return evaluateTransactionValue(transaction, allTransactions);
  }, [transaction, allTransactions]);

  // Find similar invented transactions (same town and flat type)
  const similarTransactions = useMemo(() => {
    const peers = allTransactions.filter(
      (t) =>
        t.id !== transaction.id &&
        t.town === transaction.town &&
        t.flatType === transaction.flatType
    );

    // If less than 2 same flat type, also bring in any same town
    if (peers.length < 2) {
      const townPeers = allTransactions.filter(
        (t) => t.id !== transaction.id && t.town === transaction.town
      );
      return townPeers.slice(0, 4);
    }

    return peers.slice(0, 4);
  }, [transaction, allTransactions]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Back Navigation Button */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-explore"
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-sm font-bold text-slate-800 transition-colors shadow-xs cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore Prices</span>
        </button>

        <div className="text-xs text-slate-500 hidden sm:block">
          Transaction Reference #{transaction.id}
        </div>
      </div>

      {/* Primary Highlight Card: Selected Transaction */}
      <section
        id="selected-transaction-card"
        aria-label="Selected Transaction Details"
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6"
      >
        {/* Flat Headline */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-white">
                {transaction.town}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-900 border border-slate-200">
                {transaction.flatType}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                Storey {transaction.storeyRange}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Blk {transaction.block} {transaction.streetName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Singapore HDB Resale Transaction • Sold in {formatMonth(transaction.transactionMonth)}
            </p>
          </div>

          {/* Resale Price Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:text-right shrink-0">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              Resale Transaction Price
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {formatSGD(transaction.resalePrice)}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">
              {formatSGD(transaction.pricePerSqm)} / sqm
            </div>
          </div>
        </div>

        {/* 6 Key Transaction Spec Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Town */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>Town / Estate</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900">
              {transaction.town}
            </div>
          </div>

          {/* Flat Type */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Flat Type</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900">
              {transaction.flatType}
            </div>
          </div>

          {/* Floor Area */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Floor Area</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900">
              {transaction.floorArea} sqm
            </div>
            <div className="text-[11px] text-slate-500">
              ~{Math.round(transaction.floorArea * 10.764)} sqft
            </div>
          </div>

          {/* Price Per Sqm */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Price / sqm</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900">
              {formatSGD(transaction.pricePerSqm)}
            </div>
            <div className="text-[11px] text-slate-500">
              ~{formatSGD(Math.round(transaction.pricePerSqm / 10.764))} / sqft
            </div>
          </div>

          {/* Storey Range */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Storey Range</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900">
              {transaction.storeyRange}
            </div>
            <div className="text-[11px] text-slate-500">Floor level tier</div>
          </div>

          {/* Remaining Lease */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Remaining Lease</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900">
              {transaction.remainingLease}
            </div>
            <div className="text-[11px] text-slate-500">99-year HDB tenure</div>
          </div>
        </div>
      </section>

      {/* Relative Valuation Assessment: Cheap vs Typical vs Expensive */}
      <section
        id="relative-valuation-card"
        aria-label="Relative Valuation Assessment"
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-slate-800" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Market Value Context
          </h3>
        </div>

        {/* Valuation Assessment Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Price Assessment vs {transaction.town} {transaction.flatType} Median (2017 – Present)
              </span>
              <div className="flex items-center gap-2">
                {evaluation.tag === 'Below Typical' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Relatively Cheap / Below Median
                  </span>
                )}
                {evaluation.tag === 'Typical Range' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    Typical Market Range
                  </span>
                )}
                {evaluation.tag === 'Above Typical' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Above Typical / Premium
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-500">Peer Median Price</div>
              <div className="text-lg font-bold text-slate-900">
                {formatSGD(evaluation.peerMedian)}
              </div>
              <div
                className={`text-xs font-bold ${
                  evaluation.diffPercent > 0
                    ? 'text-amber-700'
                    : evaluation.diffPercent < 0
                    ? 'text-emerald-700'
                    : 'text-slate-600'
                }`}
              >
                {evaluation.diffPercent >= 0 ? '+' : ''}
                {formatSGD(evaluation.diffAmount)} ({evaluation.diffPercent >= 0 ? '+' : ''}
                {evaluation.diffPercent}%)
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-200">
            {evaluation.verdict}
          </p>
        </div>
      </section>

      {/* Similar Invented Transactions in Same Town & Flat Type */}
      <section aria-label="Similar Invented Transactions">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Similar Transactions in {transaction.town} ({transaction.flatType})
            </h3>
            <p className="text-xs text-slate-500">
              Compare this unit against other recorded resale records in {transaction.town} from 2017 until present time
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {similarTransactions.length} comparable sales found
          </span>
        </div>

        {similarTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
            <p className="text-sm">No additional transactions in this specific town & flat type.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {similarTransactions.map((similar) => {
              const priceDiff = similar.resalePrice - transaction.resalePrice;
              return (
                <div
                  key={similar.id}
                  id={`similar-tx-${similar.id}`}
                  onClick={() => onSelectTransaction(similar)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-400 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTransaction(similar);
                    }
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-900">
                        Blk {similar.block} {similar.streetName}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {formatMonth(similar.transactionMonth)}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-lg font-black text-slate-900">
                        {formatSGD(similar.resalePrice)}
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          priceDiff > 0
                            ? 'bg-amber-50 text-amber-800'
                            : priceDiff < 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {priceDiff > 0 ? `+${formatCompactSGD(priceDiff)} higher` : priceDiff < 0 ? `${formatCompactSGD(priceDiff)} cheaper` : 'Same price'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span>Storey {similar.storeyRange}</span>
                      <span>•</span>
                      <span>{similar.floorArea} sqm</span>
                      <span>•</span>
                      <span>Lease: {similar.remainingLeaseYears} yrs</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end text-xs font-bold text-slate-800 hover:text-amber-600">
                    <span>Inspect this flat</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
