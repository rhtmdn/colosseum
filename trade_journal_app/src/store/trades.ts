import type { Trade, JournalEntry, Portfolio, AssetClass } from '../types';
import { calculatePnl, calculateRMultiple, calculateTradeStatus } from '../utils/calculations';

const TRADES_KEY = 'tj_trades';
const JOURNAL_KEY = 'tj_journal';
const PORTFOLIOS_KEY = 'tj_portfolios';
const ACTIVE_PORTFOLIO_KEY = 'tj_active_portfolio';

const DEFAULT_PORTFOLIOS: Portfolio[] = [
  { id: 'default', name: 'Main Portfolio', color: '#6366f1', createdAt: new Date().toISOString(), initialBalance: 10000, transactions: [] },
  { id: 'paper', name: 'Paper Trading', color: '#22c55e', createdAt: new Date().toISOString(), initialBalance: 50000, transactions: [] },
];

// --- Portfolios ---

export function loadPortfolios(): Portfolio[] {
  const raw = localStorage.getItem(PORTFOLIOS_KEY);
  if (!raw) {
    savePortfolios(DEFAULT_PORTFOLIOS);
    return DEFAULT_PORTFOLIOS;
  }
  // Migrate portfolios missing the transactions field
  const parsed: Portfolio[] = JSON.parse(raw);
  return parsed.map(p => ({
    ...p,
    initialBalance: p.initialBalance ?? 0,
    transactions: p.transactions ?? [],
  }));
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
  if (!raw) return [];
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

type CsvFormat = 'mt5' | 'ibkr' | 'unknown';

function detectCsvFormat(headers: string[]): CsvFormat {
  const h = headers.map(s => s.trim().toLowerCase());
  // MT5: has 'open time', 'close time', 'open price', 'close price'
  if (h.includes('open time') && h.includes('close time') && h.includes('open price')) return 'mt5';
  // IBKR Flex: has 'symbol', 'date/time' or 'datetime', 'quantity', 't. price' or 'tradeprice'
  if ((h.includes('symbol') || h.includes('underlying symbol')) &&
      (h.includes('date/time') || h.includes('datetime') || h.includes('tradedate'))) return 'ibkr';
  return 'unknown';
}

export function parseCsvTrades(csvText: string, portfolioId: string): Trade[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const format = detectCsvFormat(header);

  if (format === 'ibkr') return parseIbkrCsv(lines, header, portfolioId);
  // Default to MT5 format
  return parseMt5Csv(lines, header, portfolioId);
}

function parseMt5Csv(lines: string[], header: string[], portfolioId: string): Trade[] {
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

    const typeVal = get(row, 'type');
    if (!typeVal || typeVal === '') continue;
    if (get(row, 'login').toLowerCase() === 'totals') continue;

    const symbol = get(row, 'symbol').replace(/\.+$/, '');
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

    trades.push({
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
      pnl: profit,
      fees: 0,
      netPnl: profit,
      rMultiple: null,
      stopLoss: null,
      takeProfit: null,
      notes: `Order #${get(row, 'order')}`,
      tags: ['Imported', 'MT5'],
      rating: 3,
      screenshots: [],
      status: profit > 0 ? 'WIN' : profit < 0 ? 'LOSS' : 'BREAKEVEN',
    });
  }

  return trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
}

function parseIbkrCsv(lines: string[], header: string[], portfolioId: string): Trade[] {
  const colMap = new Map<string, number>();
  header.forEach((h, i) => colMap.set(h.trim().toLowerCase(), i));

  const get = (row: string[], key: string): string => {
    const idx = colMap.get(key);
    return idx !== undefined ? (row[idx] || '').trim() : '';
  };

  // Try multiple column name variants IBKR uses
  const getAny = (row: string[], ...keys: string[]): string => {
    for (const k of keys) {
      const v = get(row, k);
      if (v) return v;
    }
    return '';
  };

  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 3) continue;

    const symbol = getAny(row, 'symbol', 'underlying symbol').replace(/\s+/g, '');
    if (!symbol) continue;

    // Skip header/section rows
    const dataType = get(row, 'datadiscriminator');
    if (dataType && dataType.toLowerCase() !== 'order') continue;

    const qty = parseFloat(getAny(row, 'quantity', 'qty'));
    const price = parseFloat(getAny(row, 't. price', 'tradeprice', 'price'));
    const proceeds = parseFloat(getAny(row, 'proceeds', 'amount'));
    const commission = parseFloat(getAny(row, 'comm/fee', 'ibcommission', 'commission')) || 0;
    const realizedPnl = parseFloat(getAny(row, 'realized p/l', 'realizedpl', 'mtm p/l'));
    const dateStr = getAny(row, 'date/time', 'datetime', 'tradedate');

    if (isNaN(price) || isNaN(qty) || !dateStr) continue;

    const side = qty > 0 ? 'LONG' as const : 'SHORT' as const;
    const absQty = Math.abs(qty);

    // Parse IBKR date formats: "2025-01-15, 10:30:00" or "20250115" or "2025-01-15T10:30:00"
    let entryDate: string;
    const cleaned = dateStr.replace(/,\s*/g, 'T').replace(/\s+/g, 'T');
    const d = new Date(cleaned.includes('T') ? cleaned : cleaned.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
    entryDate = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();

    const netPnl = !isNaN(realizedPnl) ? realizedPnl : (!isNaN(proceeds) ? proceeds + commission : 0);
    const grossPnl = netPnl + Math.abs(commission);

    trades.push({
      id: crypto.randomUUID(),
      portfolioId,
      instrument: symbol,
      assetClass: detectAssetClass(symbol),
      side,
      entryPrice: price,
      exitPrice: price, // IBKR shows execution price, not entry/exit pairs
      quantity: absQty,
      entryDate,
      exitDate: entryDate,
      strategy: '',
      setup: '',
      pnl: grossPnl,
      fees: Math.abs(commission),
      netPnl,
      rMultiple: null,
      stopLoss: null,
      takeProfit: null,
      notes: '',
      tags: ['Imported', 'IBKR'],
      rating: 3,
      screenshots: [],
      status: netPnl > 0 ? 'WIN' : netPnl < 0 ? 'LOSS' : 'BREAKEVEN',
    });
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

