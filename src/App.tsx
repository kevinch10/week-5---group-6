import React, { useState, useEffect, useCallback } from 'react';
import { Screen, HDBTransaction } from './types';
import { Navbar } from './components/Navbar';
import { ExplorePrices } from './components/ExplorePrices';
import { CompareTowns } from './components/CompareTowns';
import { TransactionDetail } from './components/TransactionDetail';
import { fetchLiveTransactions, HdbFetchError } from './services/hdbApi';
import { DataStatus } from './components/DataStateMessage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('explore');
  const [selectedTown, setSelectedTown] = useState<string>('TAMPINES');
  const [selectedFlatType, setSelectedFlatType] = useState<string>('4 ROOM');
  const [selectedTransaction, setSelectedTransaction] = useState<HDBTransaction | null>(null);

  const [transactions, setTransactions] = useState<HDBTransaction[]>([]);
  const [allTransactionsPool, setAllTransactionsPool] = useState<HDBTransaction[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus>('loading');
  const [fetchError, setFetchError] = useState<HdbFetchError | null>(null);

  // Fetch live data for Explore Prices screen from /api/hdb
  const loadData = useCallback(async (town: string, flatType: string) => {
    setDataStatus('loading');
    setFetchError(null);
    try {
      const res = await fetchLiveTransactions(town, flatType);
      if (res.transactions.length === 0) {
        setDataStatus('empty');
        setTransactions([]);
      } else {
        setTransactions(res.transactions);
        setDataStatus('success');

        // Pre-select first transaction for TransactionDetail view
        setSelectedTransaction((prev) => {
          if (!prev) return res.transactions[0] || null;
          const stillExists = res.transactions.find((t) => t.id === prev.id);
          return stillExists || res.transactions[0] || null;
        });

        // Accumulate in transaction pool for CompareTowns and TransactionDetail
        setAllTransactionsPool((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newItems = res.transactions.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });
      }
    } catch (err: any) {
      setFetchError(err);
      if (err?.type === 'unreachable') {
        setDataStatus('unreachable');
      } else if (err?.type === 'refused') {
        setDataStatus('refused');
      } else {
        setDataStatus('refused');
      }
    }
  }, []);

  // Initial and reactive load whenever town or flat type changes
  useEffect(() => {
    loadData(selectedTown, selectedFlatType);
  }, [selectedTown, selectedFlatType, loadData]);

  // Pre-load common comparison town (PUNGGOL) in background so CompareTowns is ready
  useEffect(() => {
    fetchLiveTransactions('PUNGGOL', '4 ROOM')
      .then((res) => {
        setAllTransactionsPool((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newItems = res.transactions.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });
      })
      .catch(() => {
        // background prefetch failure is non-blocking
      });
  }, []);

  const handleSelectTransaction = (tx: HDBTransaction) => {
    setSelectedTransaction(tx);
    setCurrentScreen('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreTownFromCompare = (town: string) => {
    setSelectedTown(town);
    setCurrentScreen('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    loadData(selectedTown, selectedFlatType);
  };

  const handleResetFilters = () => {
    setSelectedTown('TAMPINES');
    setSelectedFlatType('4 ROOM');
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans antialiased selection:bg-amber-200 selection:text-slate-900">
      {/* Sticky Top Navbar with Tab Navigation */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hasSelectedTransaction={!!selectedTransaction}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentScreen === 'explore' && (
          <ExplorePrices
            transactions={transactions}
            selectedTown={selectedTown}
            selectedFlatType={selectedFlatType}
            onTownChange={setSelectedTown}
            onFlatTypeChange={setSelectedFlatType}
            onSelectTransaction={handleSelectTransaction}
            dataStatus={dataStatus}
            fetchError={fetchError}
            onRetry={handleRetry}
            onResetFilters={handleResetFilters}
          />
        )}

        {currentScreen === 'compare' && (
          <CompareTowns
            transactions={allTransactionsPool.length > 0 ? allTransactionsPool : transactions}
            onExploreTown={handleExploreTownFromCompare}
          />
        )}

        {currentScreen === 'detail' && selectedTransaction && (
          <TransactionDetail
            transaction={selectedTransaction}
            allTransactions={allTransactionsPool.length > 0 ? allTransactionsPool : transactions}
            onBack={() => {
              setCurrentScreen('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectTransaction={handleSelectTransaction}
          />
        )}
      </main>

      {/* Clean Footer with data.gov.sg credit */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-700">
            HDB Resale Price Explorer — Singapore Homebuyer & Renter Guide
          </p>
          <p className="text-slate-600">
            Data sourced directly from{' '}
            <a
              href="https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-slate-800 underline hover:text-slate-950 transition-colors"
            >
              data.gov.sg
            </a>{' '}
            (Housing & Development Board Resale Flat Prices dataset).
          </p>
          <p className="text-slate-400 text-[11px]">
            MGMT 6110 Human-AI Collaboration at SMU • Individual Problem Set 1
          </p>
        </div>
      </footer>
    </div>
  );
}
