import { useState, useCallback, useMemo, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Trade, FilterState, JournalEntry, Portfolio, Transaction } from '../types';
import {
  loadTrades, saveTrades, createTrade, loadJournalEntries, saveJournalEntries,
  loadPortfolios, savePortfolios, loadActivePortfolioId, saveActivePortfolioId,
  parseCsvTrades,
} from './trades';
import { getPortfolioStats, getDailyStats, getEquityCurve } from '../utils/calculations';

const defaultFilter: FilterState = {
  dateFrom: '',
  dateTo: '',
  instruments: [],
  strategies: [],
  sides: [],
  assetClasses: [],
  status: [],
  tags: [],
};

const DOC_REF = doc(db, 'users', 'default_user_v1');

export function useTradeStore() {
  const [trades, setTrades] = useState<Trade[]>(loadTrades);
  const [filter, setFilter] = useState<FilterState>(defaultFilter);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(loadJournalEntries);
  const [portfolios, setPortfolios] = useState<Portfolio[]>(loadPortfolios);
  const [activePortfolioId, setActivePortfolioIdState] = useState<string>(loadActivePortfolioId);

  // Firestore Sync Effect
  useEffect(() => {
    const unsub = onSnapshot(DOC_REF, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.trades) { setTrades(data.trades); saveTrades(data.trades); }
        if (data.portfolios) { setPortfolios(data.portfolios); savePortfolios(data.portfolios); }
        if (data.activePortfolioId) { setActivePortfolioIdState(data.activePortfolioId); saveActivePortfolioId(data.activePortfolioId); }
        if (data.journalEntries) { setJournalEntries(data.journalEntries); saveJournalEntries(data.journalEntries); }
      } else {
        // Init cloud database with local data if it doesn't exist yet
        setDoc(DOC_REF, {
          trades: loadTrades(),
          portfolios: loadPortfolios(),
          activePortfolioId: loadActivePortfolioId(),
          journalEntries: loadJournalEntries()
        }, { merge: true }).catch(console.error);
      }
    });
    return unsub;
  }, []);

  const activePortfolio = useMemo(
    () => portfolios.find(p => p.id === activePortfolioId) || portfolios[0],
    [portfolios, activePortfolioId]
  );

  const setActivePortfolioId = useCallback((id: string) => {
    setActivePortfolioIdState(id);
    saveActivePortfolioId(id);
    setDoc(DOC_REF, { activePortfolioId: id }, { merge: true }).catch(console.error);
  }, []);

  const addPortfolio = useCallback((name: string, color: string, initialBalance: number = 0) => {
    const p: Portfolio = { id: crypto.randomUUID(), name, color, createdAt: new Date().toISOString(), initialBalance, transactions: [] };
    setPortfolios(prev => {
      const next = [...prev, p];
      savePortfolios(next);
      setDoc(DOC_REF, { portfolios: next }, { merge: true }).catch(console.error);
      return next;
    });
    return p;
  }, []);

  const deletePortfolio = useCallback((id: string) => {
    setPortfolios(prev => {
      const next = prev.filter(p => p.id !== id);
      savePortfolios(next);
      setDoc(DOC_REF, { portfolios: next }, { merge: true }).catch(console.error);
      return next;
    });
    // Remove trades in that portfolio
    setTrades(prev => {
      const next = prev.filter(t => t.portfolioId !== id);
      saveTrades(next);
      setDoc(DOC_REF, { trades: next }, { merge: true }).catch(console.error);
      return next;
    });
  }, []);

  const renamePortfolio = useCallback((id: string, name: string) => {
    setPortfolios(prev => {
      const next = prev.map(p => p.id === id ? { ...p, name } : p);
      savePortfolios(next);
      setDoc(DOC_REF, { portfolios: next }, { merge: true }).catch(console.error);
      return next;
    });
  }, []);

  const updatePortfolio = useCallback((id: string, updates: Partial<Pick<Portfolio, 'initialBalance' | 'name' | 'color'>>) => {
    setPortfolios(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      savePortfolios(next);
      setDoc(DOC_REF, { portfolios: next }, { merge: true }).catch(console.error);
      return next;
    });
  }, []);

  const addTransaction = useCallback((portfolioId: string, type: Transaction['type'], amount: number, note: string = '') => {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount: Math.abs(amount),
      date: new Date().toISOString(),
      note,
    };
    setPortfolios(prev => {
      const next = prev.map(p => {
        if (p.id !== portfolioId) return p;
        return { ...p, transactions: [tx, ...(p.transactions || [])] };
      });
      savePortfolios(next);
      setDoc(DOC_REF, { portfolios: next }, { merge: true }).catch(console.error);
      return next;
    });
    return tx;
  }, []);

  const deleteTransaction = useCallback((portfolioId: string, transactionId: string) => {
    setPortfolios(prev => {
      const next = prev.map(p => {
        if (p.id !== portfolioId) return p;
        return { ...p, transactions: (p.transactions || []).filter(tx => tx.id !== transactionId) };
      });
      savePortfolios(next);
      setDoc(DOC_REF, { portfolios: next }, { merge: true }).catch(console.error);
      return next;
    });
  }, []);

  const updateTrades = useCallback((updater: (prev: Trade[]) => Trade[]) => {
    setTrades(prev => {
      const next = updater(prev);
      saveTrades(next);
      setDoc(DOC_REF, { trades: next }, { merge: true }).catch(console.error);
      return next;
    });
  }, []);

  const addTrade = useCallback((input: Parameters<typeof createTrade>[0]) => {
    const trade = createTrade(input);
    updateTrades(prev => [trade, ...prev]);
    return trade;
  }, [updateTrades]);

  const importCsvTrades = useCallback((csvText: string) => {
    const imported = parseCsvTrades(csvText, activePortfolioId);
    if (imported.length > 0) {
      updateTrades(prev => [...imported, ...prev]);
    }
    return imported.length;
  }, [activePortfolioId, updateTrades]);

  const updateTrade = useCallback((id: string, updates: Partial<Trade>) => {
    updateTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [updateTrades]);

  const deleteTrade = useCallback((id: string) => {
    updateTrades(prev => prev.filter(t => t.id !== id));
  }, [updateTrades]);

  // Filter by active portfolio first, then by user filters
  const portfolioTrades = useMemo(
    () => trades.filter(t => t.portfolioId === activePortfolioId),
    [trades, activePortfolioId]
  );

  const filteredTrades = useMemo(() => {
    return portfolioTrades.filter(t => {
      if (filter.dateFrom && t.entryDate < filter.dateFrom) return false;
      if (filter.dateTo && t.entryDate > filter.dateTo) return false;
      if (filter.instruments.length && !filter.instruments.includes(t.instrument)) return false;
      if (filter.strategies.length && !filter.strategies.includes(t.strategy)) return false;
      if (filter.sides.length && !filter.sides.includes(t.side)) return false;
      if (filter.assetClasses.length && !filter.assetClasses.includes(t.assetClass)) return false;
      if (filter.status.length && !filter.status.includes(t.status)) return false;
      if (filter.tags.length && !filter.tags.some(tag => t.tags.includes(tag))) return false;
      return true;
    });
  }, [portfolioTrades, filter]);

  const transactionTotal = useMemo(() => {
    const txns = activePortfolio?.transactions || [];
    return txns.reduce((sum, tx) => sum + (tx.type === 'DEPOSIT' ? tx.amount : -tx.amount), 0);
  }, [activePortfolio?.transactions]);

  const effectiveBalance = (activePortfolio?.initialBalance || 0) + transactionTotal;

  const stats = useMemo(() => getPortfolioStats(filteredTrades, effectiveBalance), [filteredTrades, effectiveBalance]);
  const dailyStats = useMemo(() => getDailyStats(filteredTrades), [filteredTrades]);
  const equityCurve = useMemo(() => getEquityCurve(filteredTrades, effectiveBalance), [filteredTrades, effectiveBalance]);

  const instruments = useMemo(() => [...new Set(portfolioTrades.map(t => t.instrument))].sort(), [portfolioTrades]);
  const strategies = useMemo(() => [...new Set(portfolioTrades.map(t => t.strategy))].filter(Boolean).sort(), [portfolioTrades]);
  const allTags = useMemo(() => [...new Set(portfolioTrades.flatMap(t => t.tags))].sort(), [portfolioTrades]);

  const addJournalEntry = useCallback((entry: JournalEntry) => {
    setJournalEntries(prev => {
      const next = [entry, ...prev.filter(e => e.date !== entry.date)];
      saveJournalEntries(next);
      setDoc(DOC_REF, { journalEntries: next }, { merge: true }).catch(console.error);
      return next;
    });
  }, []);

  return {
    trades,
    filteredTrades,
    filter,
    setFilter,
    addTrade,
    updateTrade,
    deleteTrade,
    importCsvTrades,
    stats,
    dailyStats,
    equityCurve,
    instruments,
    strategies,
    allTags,
    journalEntries,
    addJournalEntry,
    // Portfolio
    portfolios,
    activePortfolio,
    activePortfolioId,
    setActivePortfolioId,
    addPortfolio,
    deletePortfolio,
    renamePortfolio,
    updatePortfolio,
    addTransaction,
    deleteTransaction,
  };
}
