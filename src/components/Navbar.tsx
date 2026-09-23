import React from 'react';
import { Building2, Compass, GitCompare, ChevronRight } from 'lucide-react';
import { Screen } from '../types';

interface NavbarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  hasSelectedTransaction: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  hasSelectedTransaction,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Brand Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  HDB Resale Price Explorer
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Singapore
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Every resale flat transaction from 2017 until present time
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 hidden md:flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">Resale Transactions (2017 – Present)</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 py-2 overflow-x-auto no-scrollbar" aria-label="Primary Navigation">
          <button
            id="nav-tab-explore"
            onClick={() => onNavigate('explore')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 min-h-[44px] ${
              currentScreen === 'explore'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explore Prices</span>
          </button>

          <button
            id="nav-tab-compare"
            onClick={() => onNavigate('compare')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 min-h-[44px] ${
              currentScreen === 'compare'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Compare Towns</span>
          </button>

          {hasSelectedTransaction && (
            <button
              id="nav-tab-detail"
              onClick={() => onNavigate('detail')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0 min-h-[44px] ml-auto sm:ml-0 ${
                currentScreen === 'detail'
                  ? 'bg-amber-100 text-amber-950 font-semibold border border-amber-300'
                  : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100'
              }`}
            >
              <span>Selected Flat</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
