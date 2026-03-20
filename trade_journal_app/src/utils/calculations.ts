import type { Trade, DailyStats, PortfolioStats } from '../types';
import { format, parseISO } from 'date-fns';

export function calculateTradeStatus(trade: Omit<Trade, 'status' | 'netPnl'>): Trade['status'] {
  if (trade.exitPrice === null) return 'OPEN';
  if (trade.pnl > 0) return 'WIN';
  if (trade.pnl < 0) return 'LOSS';
  return 'BREAKEVEN';
}

export function calculatePnl(trade: Pick<Trade, 'side' | 'entryPrice' | 'exitPrice' | 'quantity'>): number {
  if (trade.exitPrice === null) return 0;
  const diff = trade.side === 'LONG'
    ? trade.exitPrice - trade.entryPrice
    : trade.entryPrice - trade.exitPrice;
  return diff * trade.quantity;
}

export function calculateRMultiple(trade: Pick<Trade, 'side' | 'entryPrice' | 'exitPrice' | 'stopLoss' | 'pnl'>): number | null {
  if (trade.stopLoss === null || trade.exitPrice === null) return null;
  const risk = Math.abs(trade.entryPrice - trade.stopLoss);
  if (risk === 0) return null;
  const reward = trade.side === 'LONG'
    ? trade.exitPrice - trade.entryPrice
    : trade.entryPrice - trade.exitPrice;
  return reward / risk;
}

export function getDailyStats(trades: Trade[]): DailyStats[] {
  const closed = trades.filter(t => t.status !== 'OPEN');
  const byDate = new Map<string, Trade[]>();

  closed.forEach(t => {
    const d = t.exitDate ? format(parseISO(t.exitDate), 'yyyy-MM-dd') : format(parseISO(t.entryDate), 'yyyy-MM-dd');
    const existing = byDate.get(d) || [];
    existing.push(t);
    byDate.set(d, existing);
  });

  return Array.from(byDate.entries())
    .map(([date, dayTrades]) => ({
      date,
      trades: dayTrades.length,
      pnl: dayTrades.reduce((s, t) => s + t.netPnl, 0),
      wins: dayTrades.filter(t => t.status === 'WIN').length,
      losses: dayTrades.filter(t => t.status === 'LOSS').length,
      volume: dayTrades.reduce((s, t) => s + t.quantity, 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getPortfolioStats(trades: Trade[], initialBalance: number = 0): PortfolioStats {
  const closed = trades.filter(t => t.status !== 'OPEN');
  const wins = closed.filter(t => t.status === 'WIN');
  const losses = closed.filter(t => t.status === 'LOSS');

  const totalPnl = closed.reduce((s, t) => s + t.netPnl, 0);
  const totalFees = closed.reduce((s, t) => s + t.fees, 0);
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;

  const grossWins = wins.reduce((s, t) => s + t.netPnl, 0);
  const grossLosses = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;

  const avgWin = wins.length > 0 ? grossWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLosses / losses.length : 0;

  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.netPnl)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.netPnl)) : 0;

  const rMultiples = closed.map(t => t.rMultiple).filter((r): r is number => r !== null);
  const avgRMultiple = rMultiples.length > 0 ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : 0;

  // Max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumPnl = 0;
  const daily = getDailyStats(closed);
  daily.forEach(d => {
    cumPnl += d.pnl;
    if (cumPnl > peak) peak = cumPnl;
    const dd = peak - cumPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  // Consecutive wins/losses
  let maxConsWins = 0, maxConsLosses = 0, curWins = 0, curLosses = 0;
  closed.forEach(t => {
    if (t.status === 'WIN') {
      curWins++;
      curLosses = 0;
      maxConsWins = Math.max(maxConsWins, curWins);
    } else if (t.status === 'LOSS') {
      curLosses++;
      curWins = 0;
      maxConsLosses = Math.max(maxConsLosses, curLosses);
    }
  });

  const expectancy = closed.length > 0 ? totalPnl / closed.length : 0;

  // Sharpe (simplified daily)
  const dailyReturns = daily.map(d => d.pnl);
  const meanReturn = dailyReturns.length > 0 ? dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length : 0;
  const variance = dailyReturns.length > 1
    ? dailyReturns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / (dailyReturns.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

  // Best/worst day
  const bestDay = daily.length > 0
    ? daily.reduce((best, d) => d.pnl > best.pnl ? d : best, daily[0])
    : null;
  const worstDay = daily.length > 0
    ? daily.reduce((worst, d) => d.pnl < worst.pnl ? d : worst, daily[0])
    : null;

  return {
    initialBalance,
    currentBalance: initialBalance + totalPnl,
    totalTrades: closed.length,
    totalPnl,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    avgRMultiple,
    maxDrawdown,
    maxConsecutiveWins: maxConsWins,
    maxConsecutiveLosses: maxConsLosses,
    expectancy,
    sharpeRatio,
    totalFees,
    bestDay: bestDay ? { date: bestDay.date, pnl: bestDay.pnl } : null,
    worstDay: worstDay ? { date: worstDay.date, pnl: worstDay.pnl } : null,
  };
}

export function getEquityCurve(trades: Trade[], initialBalance: number = 0): { date: string; equity: number }[] {
  const daily = getDailyStats(trades);
  let cum = initialBalance;
  return daily.map(d => {
    cum += d.pnl;
    return { date: d.date, equity: cum };
  });
}

export function formatCurrency(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPnl(value: number): string {
  return formatCurrency(value);
}

export function pnlColor(value: number): string {
  if (value > 0) return 'text-profit';
  if (value < 0) return 'text-loss';
  return 'text-neutral';
}

export function pnlBgColor(value: number): string {
  if (value > 0) return 'bg-profit-bg';
  if (value < 0) return 'bg-loss-bg';
  return 'bg-gray-800';
}

export function formatPrice(price: number, instrument: string): string {
  const s = instrument.toUpperCase();
  // Gold/Silver
  if (s.includes('XAU') || s.includes('XAG')) return price.toFixed(2);
  // Crypto
  if (s.includes('BTC') || s.includes('ETH')) return price.toFixed(2);
  // JPY pairs (USDJPY, EURJPY, GBPJPY, etc.) — 3 decimals
  if (s.includes('JPY')) return price.toFixed(3);
  // Other major forex pairs — 5 decimals
  if ((s.includes('EUR') || s.includes('GBP') || s.includes('AUD') || s.includes('NZD') || s.includes('CHF') || s.includes('CAD')) &&
      (s.includes('USD') || s.includes('EUR') || s.includes('GBP'))) {
    return price.toFixed(5);
  }
  // Default: 2 decimals (stocks, futures, indices)
  return price.toFixed(2);
}
