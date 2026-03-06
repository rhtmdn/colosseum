import { useState, useCallback, useMemo } from 'react';
import type { Trade, FilterState, JournalEntry, Portfolio } from '../types';
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

export function useTradeStore() {
  const [trades, setTrades] = useState<Trade[]>(loadTrades);
  const [filter, setFilter] = useState<FilterState>(defaultFilter);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(loadJournalEntries);
  const [portfolios, setPortfolios] = useState<Portfolio[]>(loadPortfolios);
  const [activePortfolioId, setActivePortfolioIdState] = useState<string>(loadActivePortfolioId);

  const activePortfolio = useMemo(
    () => portfolios.find(p => p.id === activePortfolioId) || portfolios[0],
    [portfolios, activePortfolioId]
  );

  const setActivePortfolioId = useCallback((id: string) => {
    setActivePortfolioIdState(id);
    saveActivePortfolioId(id);
  }, []);

  const addPortfolio = useCallback((name: string, color: string) => {
    const p: Portfolio = { id: crypto.randomUUID(), name, color, createdAt: new Date().toISOString() };
    setPortfolios(prev => {
      const next = [...prev, p];
      savePortfolios(next);
      return next;
    });
    return p;
  }, []);

  const deletePortfolio = useCallback((id: string) => {
    setPortfolios(prev => {
      const next = prev.filter(p => p.id !== id);
      savePortfolios(next);
      return next;
    });
    // Remove trades in that portfolio
    setTrades(prev => {
      const next = prev.filter(t => t.portfolioId !== id);
      saveTrades(next);
      return next;
    });
  }, []);

  const renamePortfolio = useCallback((id: string, name: string) => {
    setPortfolios(prev => {
      const next = prev.map(p => p.id === id ? { ...p, name } : p);
      savePortfolios(next);
      return next;
    });
  }, []);

  const updateTrades = useCallback((updater: (prev: Trade[]) => Trade[]) => {
    setTrades(prev => {
      const next = updater(prev);
      saveTrades(next);
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

  const stats = useMemo(() => getPortfolioStats(filteredTrades), [filteredTrades]);
  const dailyStats = useMemo(() => getDailyStats(filteredTrades), [filteredTrades]);
  const equityCurve = useMemo(() => getEquityCurve(filteredTrades), [filteredTrades]);

  const instruments = useMemo(() => [...new Set(portfolioTrades.map(t => t.instrument))].sort(), [portfolioTrades]);
  const strategies = useMemo(() => [...new Set(portfolioTrades.map(t => t.strategy))].filter(Boolean).sort(), [portfolioTrades]);
  const allTags = useMemo(() => [...new Set(portfolioTrades.flatMap(t => t.tags))].sort(), [portfolioTrades]);

  const addJournalEntry = useCallback((entry: JournalEntry) => {
    setJournalEntries(prev => {
      const next = [entry, ...prev.filter(e => e.date !== entry.date)];
      saveJournalEntries(next);
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
  };
}
