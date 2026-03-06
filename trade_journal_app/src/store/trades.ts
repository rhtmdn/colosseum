import type { Trade, JournalEntry, Portfolio, AssetClass } from '../types';
import { calculatePnl, calculateRMultiple, calculateTradeStatus } from '../utils/calculations';

const TRADES_KEY = 'tj_trades';
const JOURNAL_KEY = 'tj_journal';
const PORTFOLIOS_KEY = 'tj_portfolios';
const ACTIVE_PORTFOLIO_KEY = 'tj_active_portfolio';

const DEFAULT_PORTFOLIOS: Portfolio[] = [
  { id: 'default', name: 'Main Portfolio', color: '#6366f1', createdAt: new Date().toISOString() },
  { id: 'paper', name: 'Paper Trading', color: '#22c55e', createdAt: new Date().toISOString() },
];

// --- Portfolios ---

export function loadPortfolios(): Portfolio[] {
  const raw = localStorage.getItem(PORTFOLIOS_KEY);
  if (!raw) {
    savePortfolios(DEFAULT_PORTFOLIOS);
    return DEFAULT_PORTFOLIOS;
  }
  return JSON.parse(raw);
}

export function savePortfolios(portfolios: Portfolio[]): void {
  localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(portfolios));
}

export function loadActivePortfolioId(): string {
  return localStorage.getItem(ACTIVE_PORTFOLIO_KEY) || 'default';
}

export function saveActivePortfolioId(id: string): void {
  localStorage.setItem(ACTIVE_PORTFOLIO_KEY, id);
}

// --- Trades ---

export function loadTrades(): Trade[] {
  const raw = localStorage.getItem(TRADES_KEY);
  if (!raw) return generateMockTrades();
  const trades: Trade[] = JSON.parse(raw);
  // Migrate trades without portfolioId
  return trades.map(t => ({ ...t, portfolioId: t.portfolioId || 'default' }));
}

export function saveTrades(trades: Trade[]): void {
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
}

export function loadJournalEntries(): JournalEntry[] {
  const raw = localStorage.getItem(JOURNAL_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveJournalEntries(entries: JournalEntry[]): void {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
}

export function createTrade(input: {
  portfolioId: string;
  instrument: string;
  assetClass: Trade['assetClass'];
  side: Trade['side'];
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryDate: string;
  exitDate: string | null;
  strategy: string;
  setup: string;
  fees: number;
  stopLoss: number | null;
  takeProfit: number | null;
  notes: string;
  tags: string[];
  rating: number;
}): Trade {
  const partial = { ...input, pnl: 0 };
  const pnl = calculatePnl(partial);
  const netPnl = pnl - input.fees;
  const trade: Trade = {
    ...input,
    id: crypto.randomUUID(),
    pnl,
    netPnl,
    rMultiple: calculateRMultiple({ ...partial, pnl, exitPrice: input.exitPrice }),
    screenshots: [],
    status: 'OPEN',
  };
  trade.status = calculateTradeStatus(trade);
  return trade;
}

// --- CSV Import ---

function detectAssetClass(symbol: string): AssetClass {
  const s = symbol.toUpperCase();
  if (s.includes('XAU') || s.includes('XAG') || s.includes('EUR') || s.includes('GBP') || s.includes('JPY') || s.includes('USD')) return 'Forex';
  if (s.includes('US500') || s.includes('US30') || s.includes('NAS') || s.includes('SPX') || s.match(/H\d$/)) return 'Futures';
  if (s.includes('BTC') || s.includes('ETH') || s.includes('CRYPTO')) return 'Crypto';
  return 'Stocks';
}

export function parseCsvTrades(csvText: string, portfolioId: string): Trade[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const header = parseCsvLine(lines[0]);
  const colMap = new Map<string, number>();
  header.forEach((h, i) => colMap.set(h.trim().toLowerCase(), i));

  const get = (row: string[], key: string): string => {
    const idx = colMap.get(key);
    return idx !== undefined ? (row[idx] || '').trim() : '';
  };

  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < header.length) continue;

    // Skip totals/summary rows
    const typeVal = get(row, 'type');
    if (!typeVal || typeVal === '') continue;
    if (get(row, 'login').toLowerCase() === 'totals') continue;

    const symbol = get(row, 'symbol').replace(/\.+$/, ''); // Strip trailing dots
    if (!symbol) continue;

    const side = typeVal.toUpperCase() === 'SELL' ? 'SHORT' as const : 'LONG' as const;
    const openPrice = parseFloat(get(row, 'open price'));
    const closePrice = parseFloat(get(row, 'close price'));
    const volume = parseFloat(get(row, 'volume'));
    const profit = parseFloat(get(row, 'profit'));
    const openTime = get(row, 'open time');
    const closeTime = get(row, 'close time');

    if (isNaN(openPrice) || isNaN(closePrice)) continue;

    const entryDate = parseMt5Date(openTime);
    const exitDate = parseMt5Date(closeTime);

    const trade: Trade = {
      id: crypto.randomUUID(),
      portfolioId,
      instrument: symbol,
      assetClass: detectAssetClass(symbol),
      side,
      entryPrice: openPrice,
      exitPrice: closePrice,
      quantity: volume,
      entryDate,
      exitDate,
      strategy: '',
      setup: '',
      // Use the broker-reported profit directly as netPnl
      pnl: profit,
      fees: 0,
      netPnl: profit,
      rMultiple: null,
      stopLoss: null,
      takeProfit: null,
      notes: `Order #${get(row, 'order')}`,
      tags: ['Imported'],
      rating: 3,
      screenshots: [],
      status: profit > 0 ? 'WIN' : profit < 0 ? 'LOSS' : 'BREAKEVEN',
    };

    trades.push(trade);
  }

  return trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseMt5Date(dateStr: string): string {
  // Format: "2025-12-31 10:05:05"
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// --- Mock data ---

function generateMockTrades(): Trade[] {
  const instruments = ['XAUUSD', 'AAPL', 'TSLA', 'ES', 'NQ', 'XAGUSD', 'SPY', 'NVDA', 'AMZN', 'META'];
  const strategies = ['VWAP Bounce', 'PDH/PDL Break', 'Liquidity Sweep', 'Mean Reversion', 'Momentum Break', 'AVWAP Reclaim'];
  const setups = ['A+', 'A', 'B+', 'B', 'C'];
  const assetClasses: Trade['assetClass'][] = ['Forex', 'Stocks', 'Futures', 'Stocks', 'Futures', 'Forex', 'Stocks', 'Stocks', 'Stocks', 'Stocks'];
  const tags = ['AMT', 'Volume Profile', 'Sweep', 'Breakout', 'Reversal', 'Trend'];

  const trades: Trade[] = [];
  const today = new Date();

  for (let i = 0; i < 85; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const entryDate = new Date(today);
    entryDate.setDate(entryDate.getDate() - daysAgo);

    if (entryDate.getDay() === 0 || entryDate.getDay() === 6) continue;

    const exitDate = new Date(entryDate);
    exitDate.setHours(exitDate.getHours() + Math.floor(Math.random() * 6) + 1);

    const instIdx = Math.floor(Math.random() * instruments.length);
    const instrument = instruments[instIdx];
    const side: Trade['side'] = Math.random() > 0.45 ? 'LONG' : 'SHORT';

    let entryPrice: number;
    let priceMove: number;

    switch (instrument) {
      case 'XAUUSD': entryPrice = 2300 + Math.random() * 100; priceMove = (Math.random() - 0.42) * 30; break;
      case 'XAGUSD': entryPrice = 28 + Math.random() * 4; priceMove = (Math.random() - 0.42) * 2; break;
      case 'ES': entryPrice = 5200 + Math.random() * 200; priceMove = (Math.random() - 0.42) * 40; break;
      case 'NQ': entryPrice = 18000 + Math.random() * 1000; priceMove = (Math.random() - 0.42) * 150; break;
      default: entryPrice = 150 + Math.random() * 200; priceMove = (Math.random() - 0.42) * 15; break;
    }

    const exitPrice = entryPrice + (side === 'LONG' ? priceMove : -priceMove);
    const quantity = instrument === 'XAUUSD' ? Math.ceil(Math.random() * 5) :
      instrument === 'ES' || instrument === 'NQ' ? Math.ceil(Math.random() * 3) :
      Math.ceil(Math.random() * 100);

    const fees = Math.random() * 10 + 1;
    const stopDist = Math.abs(priceMove) * (0.3 + Math.random() * 0.7);
    const stopLoss = side === 'LONG' ? entryPrice - stopDist : entryPrice + stopDist;

    const tradeInput = {
      portfolioId: 'default',
      instrument,
      assetClass: assetClasses[instIdx],
      side,
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: Math.round(exitPrice * 100) / 100,
      quantity,
      entryDate: entryDate.toISOString(),
      exitDate: exitDate.toISOString(),
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      setup: setups[Math.floor(Math.random() * setups.length)],
      fees: Math.round(fees * 100) / 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      takeProfit: null,
      notes: '',
      tags: [tags[Math.floor(Math.random() * tags.length)]],
      rating: Math.ceil(Math.random() * 5),
    };

    trades.push(createTrade(tradeInput));
  }

  trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  saveTrades(trades);
  return trades;
}
