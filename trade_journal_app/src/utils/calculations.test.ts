import { describe, it, expect } from 'vitest';
import {
  calculatePnl,
  calculateRMultiple,
  calculateTradeStatus,
  formatPrice,
  formatCurrency,
  getPortfolioStats,
  getDailyStats,
} from './calculations';
import type { Trade } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: '1',
    portfolioId: 'p1',
    instrument: 'AAPL',
    assetClass: 'Stocks',
    side: 'LONG',
    entryPrice: 100,
    exitPrice: 110,
    quantity: 10,
    entryDate: '2024-01-02T10:00:00Z',
    exitDate: '2024-01-02T15:00:00Z',
    strategy: '',
    setup: '',
    pnl: 100,
    fees: 0,
    netPnl: 100,
    rMultiple: null,
    stopLoss: null,
    takeProfit: null,
    notes: '',
    tags: [],
    rating: 3,
    screenshots: [],
    status: 'WIN',
    ...overrides,
  };
}

// ─── calculatePnl ────────────────────────────────────────────────────────────

describe('calculatePnl', () => {
  it('LONG win: (exit - entry) * qty', () => {
    expect(calculatePnl({ side: 'LONG', entryPrice: 100, exitPrice: 110, quantity: 10 })).toBe(100);
  });

  it('LONG loss: negative when exit < entry', () => {
    expect(calculatePnl({ side: 'LONG', entryPrice: 100, exitPrice: 90, quantity: 5 })).toBe(-50);
  });

  it('SHORT win: (entry - exit) * qty', () => {
    expect(calculatePnl({ side: 'SHORT', entryPrice: 110, exitPrice: 100, quantity: 10 })).toBe(100);
  });

  it('SHORT loss: negative when exit > entry', () => {
    expect(calculatePnl({ side: 'SHORT', entryPrice: 100, exitPrice: 110, quantity: 5 })).toBe(-50);
  });

  it('returns 0 when no exit price', () => {
    expect(calculatePnl({ side: 'LONG', entryPrice: 100, exitPrice: null, quantity: 10 })).toBe(0);
  });

  it('breakeven: returns 0', () => {
    expect(calculatePnl({ side: 'LONG', entryPrice: 100, exitPrice: 100, quantity: 10 })).toBe(0);
  });
});

// ─── calculateRMultiple ──────────────────────────────────────────────────────

describe('calculateRMultiple', () => {
  it('2R long trade', () => {
    const r = calculateRMultiple({ side: 'LONG', entryPrice: 100, exitPrice: 120, stopLoss: 90, pnl: 20 });
    expect(r).toBeCloseTo(2);
  });

  it('-1R long trade (stopped out)', () => {
    const r = calculateRMultiple({ side: 'LONG', entryPrice: 100, exitPrice: 90, stopLoss: 90, pnl: -10 });
    expect(r).toBeCloseTo(-1);
  });

  it('2R short trade', () => {
    const r = calculateRMultiple({ side: 'SHORT', entryPrice: 100, exitPrice: 80, stopLoss: 110, pnl: 20 });
    expect(r).toBeCloseTo(2);
  });

  it('returns null when no stopLoss', () => {
    expect(calculateRMultiple({ side: 'LONG', entryPrice: 100, exitPrice: 110, stopLoss: null, pnl: 10 })).toBeNull();
  });

  it('returns null when no exitPrice', () => {
    expect(calculateRMultiple({ side: 'LONG', entryPrice: 100, exitPrice: null, stopLoss: 90, pnl: 0 })).toBeNull();
  });

  it('returns null when risk is zero (stop == entry)', () => {
    expect(calculateRMultiple({ side: 'LONG', entryPrice: 100, exitPrice: 110, stopLoss: 100, pnl: 10 })).toBeNull();
  });
});

// ─── calculateTradeStatus ────────────────────────────────────────────────────

describe('calculateTradeStatus', () => {
  const base = makeTrade({ exitPrice: 110, pnl: 100 });

  it('WIN when pnl > 0', () => {
    expect(calculateTradeStatus({ ...base, pnl: 50 })).toBe('WIN');
  });

  it('LOSS when pnl < 0', () => {
    expect(calculateTradeStatus({ ...base, pnl: -50 })).toBe('LOSS');
  });

  it('BREAKEVEN when pnl === 0', () => {
    expect(calculateTradeStatus({ ...base, pnl: 0 })).toBe('BREAKEVEN');
  });

  it('OPEN when exitPrice is null', () => {
    expect(calculateTradeStatus({ ...base, exitPrice: null, pnl: 0 })).toBe('OPEN');
  });
});

// ─── formatPrice ─────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('5 decimals for EURUSD', () => {
    expect(formatPrice(1.08532, 'EURUSD')).toBe('1.08532');
  });

  it('3 decimals for USDJPY', () => {
    expect(formatPrice(151.234, 'USDJPY')).toBe('151.234');
  });

  it('2 decimals for XAUUSD', () => {
    expect(formatPrice(2341.5, 'XAUUSD')).toBe('2341.50');
  });

  it('2 decimals for XAGUSD', () => {
    expect(formatPrice(29.75, 'XAGUSD')).toBe('29.75');
  });

  it('2 decimals for AAPL stock', () => {
    expect(formatPrice(182.5, 'AAPL')).toBe('182.50');
  });

  it('2 decimals for BTC', () => {
    expect(formatPrice(65000, 'BTCUSD')).toBe('65000.00');
  });
});

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('positive value gets + prefix', () => {
    expect(formatCurrency(1234.5)).toBe('+$1,234.50');
  });

  it('negative value gets minus sign', () => {
    expect(formatCurrency(-500)).toBe('-$500.00');
  });

  it('zero shows +$0.00', () => {
    expect(formatCurrency(0)).toBe('+$0.00');
  });
});

// ─── getDailyStats ────────────────────────────────────────────────────────────

describe('getDailyStats', () => {
  const trades: Trade[] = [
    makeTrade({ id: '1', exitDate: '2024-01-02T15:00:00Z', netPnl: 100, status: 'WIN', quantity: 5 }),
    makeTrade({ id: '2', exitDate: '2024-01-02T16:00:00Z', netPnl: -50, status: 'LOSS', quantity: 3 }),
    makeTrade({ id: '3', exitDate: '2024-01-03T15:00:00Z', netPnl: 200, status: 'WIN', quantity: 10 }),
    makeTrade({ id: '4', exitDate: null, status: 'OPEN', netPnl: 0, quantity: 1 }),
  ];

  it('groups trades by exit date, excludes open', () => {
    const stats = getDailyStats(trades);
    expect(stats).toHaveLength(2);
  });

  it('correctly sums pnl for 2024-01-02', () => {
    const stats = getDailyStats(trades);
    const day = stats.find(d => d.date === '2024-01-02');
    expect(day?.pnl).toBe(50);
    expect(day?.wins).toBe(1);
    expect(day?.losses).toBe(1);
    expect(day?.trades).toBe(2);
  });

  it('correctly handles single-trade day 2024-01-03', () => {
    const stats = getDailyStats(trades);
    const day = stats.find(d => d.date === '2024-01-03');
    expect(day?.pnl).toBe(200);
    expect(day?.wins).toBe(1);
  });

  it('returns empty array for empty trades', () => {
    expect(getDailyStats([])).toEqual([]);
  });
});

// ─── getPortfolioStats ────────────────────────────────────────────────────────

describe('getPortfolioStats', () => {
  const trades: Trade[] = [
    makeTrade({ id: '1', netPnl: 200, pnl: 200, status: 'WIN', fees: 2, exitDate: '2024-01-02T15:00:00Z', rMultiple: 2 }),
    makeTrade({ id: '2', netPnl: -100, pnl: -100, status: 'LOSS', fees: 2, exitDate: '2024-01-03T15:00:00Z', rMultiple: -1 }),
    makeTrade({ id: '3', netPnl: 0, pnl: 0, status: 'OPEN', fees: 0, exitDate: null, rMultiple: null }),
  ];

  it('counts only closed trades', () => {
    const stats = getPortfolioStats(trades);
    expect(stats.totalTrades).toBe(2);
  });

  it('calculates totalPnl correctly', () => {
    const stats = getPortfolioStats(trades);
    expect(stats.totalPnl).toBe(100);
  });

  it('calculates winRate as 50%', () => {
    const stats = getPortfolioStats(trades);
    expect(stats.winRate).toBe(50);
  });

  it('calculates profitFactor = 2 (200 gross wins / 100 gross losses)', () => {
    const stats = getPortfolioStats(trades);
    expect(stats.profitFactor).toBe(2);
  });

  it('calculates avgRMultiple = 0.5', () => {
    const stats = getPortfolioStats(trades);
    expect(stats.avgRMultiple).toBe(0.5); // (2 + -1) / 2
  });

  it('returns 0 stats for empty trades', () => {
    const stats = getPortfolioStats([]);
    expect(stats.totalTrades).toBe(0);
    expect(stats.totalPnl).toBe(0);
    expect(stats.winRate).toBe(0);
  });

  it('uses initialBalance in currentBalance', () => {
    const stats = getPortfolioStats(trades, 10000);
    expect(stats.currentBalance).toBe(10100);
  });
});
