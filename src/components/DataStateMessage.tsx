import React from 'react';
import { AlertCircle, AlertTriangle, Database, Info, RefreshCw } from 'lucide-react';
import { HdbFetchError } from '../services/hdbApi';

export type DataStatus = 'loading' | 'empty' | 'refused' | 'unreachable' | 'success';

interface DataStateMessageProps {
  status: 'loading' | 'empty' | 'refused' | 'unreachable';
  error?: HdbFetchError | null;
  onRetry?: () => void;
  onResetFilters?: () => void;
}

export const DataStateMessage: React.FC<DataStateMessageProps> = ({
  status,
  error,
  onRetry,
  onResetFilters,
}) => {
  if (status === 'loading') {
    return (
      <div
        id="data-state-loading"
        role="status"
        aria-live="polite"
        className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-6 text-center text-slate-800 shadow-xs space-y-2 my-6"
      >
        <div className="inline-flex p-3 rounded-full bg-blue-100 text-blue-700 mb-1">
          <Database className="w-6 h-6" />
        </div>
        <p className="text-base sm:text-lg font-bold text-blue-950">
          Loading live HDB resale flat transaction data from data.gov.sg...
        </p>
        <p className="text-xs sm:text-sm text-blue-800/80 max-w-lg mx-auto">
          Querying the official HDB resale dataset via serverless function at /api/hdb.
        </p>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div
        id="data-state-empty"
        role="status"
        aria-live="polite"
        className="bg-red-50/50 border border-red-200 rounded-2xl p-6 sm:p-8 text-center text-slate-800 shadow-xs space-y-4 my-6"
      >
        <div className="flex items-center justify-between pb-2 border-b border-red-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Info className="w-4 h-4 text-red-500" />
            <span>Dataset Search Result</span>
          </div>
          {/* Top-right red error text */}
          <span className="text-xs sm:text-sm font-bold text-red-600 flex items-center gap-1 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            No results found.
          </span>
        </div>

        <div className="inline-flex p-3 rounded-full bg-red-100 text-red-600 mb-1">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-base sm:text-lg font-bold text-red-950">
          No HDB resale transactions were found matching your selected criteria.
        </p>
        {/* Reference quote */}
        <blockquote className="text-xs text-slate-600 italic bg-white/90 border-l-2 border-red-400 p-2.5 rounded-r-lg max-w-lg mx-auto">
          &ldquo;Zero resale records found in official data.gov.sg dataset for this query.&rdquo;
          <cite className="block not-italic text-[10px] font-semibold text-slate-400 mt-0.5">
            &mdash; Official Reference: Singapore Housing &amp; Development Board (data.gov.sg)
          </cite>
        </blockquote>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Please adjust your town, flat type, or search terms to explore available sales.
        </p>
        {onResetFilters && (
          <div className="pt-2">
            <button
              id="btn-reset-empty-filters"
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs min-h-[44px]"
            >
              Reset Filters to Tampines
            </button>
          </div>
        )}
      </div>
    );
  }

  if (status === 'refused') {
    const httpStatus = error?.upstreamStatus || 403;
    const reasonText = error?.reason || 'The upstream server rejected the request.';

    return (
      <div
        id="data-state-refused"
        role="alert"
        aria-live="assertive"
        className="bg-rose-50/90 border border-rose-200 rounded-2xl p-6 sm:p-8 text-center text-slate-800 shadow-xs space-y-3 my-6"
      >
        <div className="inline-flex p-3 rounded-full bg-rose-100 text-rose-700 mb-1">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-base sm:text-lg font-bold text-rose-950">
          data.gov.sg refused the request with HTTP status {httpStatus}: {reasonText}
        </p>
        <p className="text-xs sm:text-sm text-rose-800/80 max-w-lg mx-auto">
          The upstream data.gov.sg API returned a non-2xx status code. You can retry the request.
        </p>
        {onRetry && (
          <div className="pt-2">
            <button
              id="btn-retry-refused"
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-900 text-white text-xs font-bold hover:bg-rose-950 transition-colors cursor-pointer shadow-xs min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Request</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (status === 'unreachable') {
    return (
      <div
        id="data-state-unreachable"
        role="alert"
        aria-live="assertive"
        className="bg-slate-100 border border-slate-300 rounded-2xl p-6 sm:p-8 text-center text-slate-800 shadow-xs space-y-3 my-6"
      >
        <div className="inline-flex p-3 rounded-full bg-slate-200 text-slate-700 mb-1">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-base sm:text-lg font-bold text-slate-900">
          data.gov.sg is currently unreachable. Please check your internet connection or try again shortly.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          The connection to data.gov.sg could not be established or timed out.
        </p>
        {onRetry && (
          <div className="pt-2">
            <button
              id="btn-retry-unreachable"
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
};
