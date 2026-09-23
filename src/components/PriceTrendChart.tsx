import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Calendar } from 'lucide-react';
import { HDBTransaction, TrendTimeframe } from '../types';
import {
  TrendPoint,
  getYearlyTrends,
  getPastYearTrends,
  getPastSixMonthsTrends,
  getDesignatedYearTrends,
  getAvailableYears,
  formatSGD,
  formatCompactSGD,
} from '../utils/calculations';

interface PriceTrendChartProps {
  transactions: HDBTransaction[];
  town: string;
  flatType: string;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  transactions,
  town,
  flatType,
}) => {
  // Default to 2017–2026 yearly intervals
  const [timeframe, setTimeframe] = useState<TrendTimeframe>('2017_2026');
  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);
  const [designatedYear, setDesignatedYear] = useState<string>(() => availableYears[0] || '2025');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Sync designatedYear if transaction dataset changes
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(designatedYear)) {
      setDesignatedYear(availableYears[0]);
    }
  }, [availableYears, designatedYear]);

  // Derive trend points based on selected timeframe
  const trendPoints = useMemo<TrendPoint[]>(() => {
    switch (timeframe) {
      case '2017_2026':
        return getYearlyTrends(transactions);
      case 'past_year':
        return getPastYearTrends(transactions);
      case 'past_six_months':
        return getPastSixMonthsTrends(transactions);
      case 'designated_year':
        return getDesignatedYearTrends(transactions, designatedYear);
      default:
        return getYearlyTrends(transactions);
    }
  }, [transactions, timeframe, designatedYear]);

  // Reset active point selection when timeframe, designated year, or filters change
  useEffect(() => {
    setActivePointIndex(null);
  }, [timeframe, designatedYear, town, flatType]);

  const timeframeLabels: Record<
    TrendTimeframe,
    { title: string; subtitle: string; trendSuffix: string }
  > = {
    '2017_2026': {
      title: '2017–2026 Resale Price Trend (Yearly)',
      subtitle: 'Annual median transaction prices spanning 2017 through 2026',
      trendSuffix: 'since 2017',
    },
    past_year: {
      title: 'Past Year Price Trend (Monthly)',
      subtitle: 'Monthly median price progression over the past 12 recorded market months',
      trendSuffix: 'past year',
    },
    past_six_months: {
      title: 'Past Six Months Price Trend (Monthly)',
      subtitle: 'Short-term monthly median prices across the latest 6 recorded market months',
      trendSuffix: 'past 6 mos',
    },
    designated_year: {
      title: `Year ${designatedYear} Price Trend (Monthly)`,
      subtitle: `Monthly median price progression throughout recorded months in ${designatedYear}`,
      trendSuffix: `in ${designatedYear}`,
    },
  };

  const currentCopy = timeframeLabels[timeframe];

  // Helper render for Timeframe Selector Toolbar
  const renderTimeframeSelector = (idSuffix: string) => (
    <div
      id={`trend-timeframe-selector${idSuffix}`}
      className="inline-flex flex-wrap items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold shrink-0 gap-1"
      role="group"
      aria-label="Timeframe interval options"
    >
      <button
        id={`timeframe-2017-2026${idSuffix}`}
        type="button"
        onClick={() => setTimeframe('2017_2026')}
        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer min-h-[36px] ${
          timeframe === '2017_2026'
            ? 'bg-white text-slate-900 shadow-xs font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        2017–2026
      </button>

      <button
        id={`timeframe-past-year${idSuffix}`}
        type="button"
        onClick={() => setTimeframe('past_year')}
        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer min-h-[36px] ${
          timeframe === 'past_year'
            ? 'bg-white text-slate-900 shadow-xs font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Past Year
      </button>

      <button
        id={`timeframe-past-six-months${idSuffix}`}
        type="button"
        onClick={() => setTimeframe('past_six_months')}
        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer min-h-[36px] ${
          timeframe === 'past_six_months'
            ? 'bg-white text-slate-900 shadow-xs font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Past Six Months
      </button>

      {/* Designated Year Option with Dropdown */}
      <div className="flex items-center pl-1 sm:border-l sm:border-slate-200/80">
        <button
          id={`timeframe-designated-year-btn${idSuffix}`}
          type="button"
          onClick={() => setTimeframe('designated_year')}
          className={`px-2.5 py-1.5 rounded-l-lg transition-all cursor-pointer min-h-[36px] ${
            timeframe === 'designated_year'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Select Year:
        </button>
        <div className="relative">
          <select
            id={`designated-year-dropdown${idSuffix}`}
            value={designatedYear}
            onChange={(e) => {
              setDesignatedYear(e.target.value);
              setTimeframe('designated_year');
            }}
            aria-label="Select designated year"
            className={`text-xs font-bold rounded-r-lg border-y border-r py-1.5 pl-2.5 pr-7 min-h-[36px] cursor-pointer transition-all appearance-none outline-none ${
              timeframe === 'designated_year'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr} className="text-slate-900 bg-white">
                {yr}
              </option>
            ))}
          </select>
          <Calendar
            className={`w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
              timeframe === 'designated_year' ? 'text-slate-300' : 'text-slate-400'
            }`}
          />
        </div>
      </div>
    </div>
  );

  if (trendPoints.length === 0) {
    return (
      <div
        id="price-trend-chart-card"
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="text-left">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Price Trend Over Time
            </h3>
            <p className="text-xs text-slate-500">
              Filter by timeframe: 2017–2026 (default), past year, past six months, or select a designated year
            </p>
          </div>

          {renderTimeframeSelector('-empty')}
        </div>

        <p className="text-sm text-slate-500 py-6">
          No transaction trend data available for {timeframe === 'designated_year' ? `year ${designatedYear}` : 'this timeframe'} and the selected filters.
        </p>
      </div>
    );
  }

  // Calculate min & max for scaling
  const prices = trendPoints.map((p) => p.medianPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Add 15% vertical padding so curve doesn't clip
  const paddedMin = Math.max(0, Math.floor((minPrice - priceRange * 0.15) / 10000) * 10000);
  const paddedMax = Math.ceil((maxPrice + priceRange * 0.15) / 10000) * 10000;
  const totalScale = paddedMax - paddedMin || 1;

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const points = trendPoints.map((pt, index) => {
    const x =
      trendPoints.length === 1
        ? padLeft + plotWidth / 2
        : padLeft + (index / (trendPoints.length - 1)) * plotWidth;
    const y = padTop + plotHeight - ((pt.medianPrice - paddedMin) / totalScale) * plotHeight;
    return { ...pt, x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`;

  // Compute trend movement
  const firstPrice = trendPoints[0].medianPrice;
  const lastPrice = trendPoints[trendPoints.length - 1].medianPrice;
  const changePercent =
    firstPrice > 0 ? Number((((lastPrice - firstPrice) / firstPrice) * 100).toFixed(1)) : 0;

  const isRising = changePercent > 1.0;
  const isFalling = changePercent < -1.0;

  const activePoint =
    activePointIndex !== null ? points[activePointIndex] : points[points.length - 1];

  return (
    <div
      id="price-trend-chart-card"
      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4"
    >
      {/* Header with Title, Filter Badges, and Timeframe Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {currentCopy.title}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {town === 'ALL' ? 'All Towns' : town} • {flatType === 'ALL' ? 'All Flat Types' : flatType}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentCopy.subtitle}
          </p>
        </div>

        {/* Timeframe Pill Buttons: 2017-2026 (Default), Past Year, Past Six Months, Designated Year */}
        <div className="flex flex-wrap items-center gap-2">
          {renderTimeframeSelector('')}

          {/* Trend Indicator Badge */}
          <div>
            {isRising && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5" />
                Rising (+{changePercent}% {currentCopy.trendSuffix})
              </span>
            )}
            {isFalling && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                <TrendingDown className="w-3.5 h-3.5" />
                Easing ({changePercent}% {currentCopy.trendSuffix})
              </span>
            )}
            {!isRising && !isFalling && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                <Minus className="w-3.5 h-3.5" />
                Stable ({changePercent >= 0 ? '+' : ''}{changePercent}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Active Point Callout */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {activePoint.periodType === 'year' ? 'Period (Year):' : 'Period (Month):'}{' '}
              <strong className="text-slate-900">{activePoint.label}</strong>
            </span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span>
            Median Price:{' '}
            <strong className="text-slate-900 text-sm font-bold">
              {formatSGD(activePoint.medianPrice)}
            </strong>
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span>
            Transactions Recorded: <strong className="text-slate-900">{activePoint.count}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">Tap or hover points to inspect</span>
      </div>

      {/* Chart SVG */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 sm:h-52 select-none overflow-visible"
          role="img"
          aria-label={`HDB Price Trend Chart (${currentCopy.title})`}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const yVal = padTop + plotHeight * ratio;
            const priceVal = paddedMax - totalScale * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={yVal}
                  x2={svgWidth - padRight}
                  y2={yVal}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={yVal + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-400 font-medium"
                >
                  {formatCompactSGD(priceVal)}
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Trend line */}
          <path
            d={pathD}
            fill="none"
            stroke="#0f172a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Markers and interactive points */}
          {points.map((pt, idx) => {
            const isSelected =
              activePointIndex === idx ||
              (activePointIndex === null && idx === points.length - 1);
            return (
              <g
                key={pt.key}
                className="cursor-pointer group"
                onClick={() => setActivePointIndex(idx)}
                onMouseEnter={() => setActivePointIndex(idx)}
              >
                {/* Hit target */}
                <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                {/* Vertical helper line for active */}
                {isSelected && (
                  <line
                    x1={pt.x}
                    y1={padTop}
                    x2={pt.x}
                    y2={padTop + plotHeight}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#0f172a' : '#ffffff'}
                  stroke="#0f172a"
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all"
                />

                {/* Label on X-axis */}
                <text
                  x={pt.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className={`text-[10px] sm:text-[11px] font-semibold transition-colors ${
                    isSelected ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {pt.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Readable takeaway summary */}
      <div className="pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
        Trend takeaway:{' '}
        <span className="font-semibold text-slate-900">
          {isRising &&
            `Resale prices in this selection have trended upward (+${changePercent}%), appreciating from ${formatSGD(firstPrice)} (${points[0]?.label}) to ${formatSGD(lastPrice)} (${points[points.length - 1]?.label}).`}
          {isFalling &&
            `Resale prices have eased (${changePercent}%), adjusting from ${formatSGD(firstPrice)} (${points[0]?.label}) to ${formatSGD(lastPrice)} (${points[points.length - 1]?.label}).`}
          {!isRising &&
            !isFalling &&
            (points.length > 1
              ? `Resale prices have held steady across this timeframe within a range of ${formatSGD(minPrice)} - ${formatSGD(maxPrice)}.`
              : `Recorded resale price median in this timeframe is ${formatSGD(firstPrice)} across ${points[0]?.count} transaction(s).`)}
        </span>
      </div>
    </div>
  );
};
