export type Side = 'LONG' | 'SHORT';
export type AssetClass = 'Stocks' | 'Options' | 'Futures' | 'Forex' | 'Crypto';
export type TradeStatus = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';

export interface Trade {
  id: string;
  portfolioId: string;
  instrument: string;
  assetClass: AssetClass;
  side: Side;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryDate: string; // ISO date string
  exitDate: string | null;
  strategy: string;
  setup: string;
  pnl: number;
  fees: number;
  netPnl: number;
  rMultiple: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  notes: string;
  tags: string[];
  rating: number; // 1-5
  screenshots: string[];
  status: TradeStatus;
}

export interface Portfolio {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  initialBalance?: number;
}

export interface DailyStats {
  date: string;
  trades: number;
  pnl: number;
  wins: number;
  losses: number;
  volume: number;
}

export interface PortfolioStats {
  initialBalance: number;
  currentBalance: number;
  totalTrades: number;
  totalPnl: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  avgRMultiple: number;
  maxDrawdown: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  expectancy: number;
  sharpeRatio: number;
  totalFees: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  instruments: string[];
  strategies: string[];
  sides: Side[];
  assetClasses: AssetClass[];
  status: TradeStatus[];
  tags: string[];
}

export interface JournalEntry {
  id: string;
  date: string;
  preMarket: string;
  postMarket: string;
  mood: number; // 1-5
  lessons: string;
  mistakes: string;
}
