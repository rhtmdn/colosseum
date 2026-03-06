import { TrendingUp, TrendingDown, Zap, Clock } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import ByInstrument from '../components/analytics/ByInstrument';
import ByStrategy from '../components/analytics/ByStrategy';
import PerformanceHeatmap from '../components/analytics/PerformanceHeatmap';
import EquityChart from '../components/dashboard/EquityChart';
import type { Trade, PortfolioStats, DailyStats } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  trades: Trade[];
  stats: PortfolioStats;
  dailyStats: DailyStats[];
  equityCurve: { date: string; equity: number }[];
}

export default function AnalyticsPage({ trades, stats, dailyStats, equityCurve }: Props) {
  const closed = trades.filter(t => t.status !== 'OPEN');
  const longTrades = closed.filter(t => t.side === 'LONG');
  const shortTrades = closed.filter(t => t.side === 'SHORT');
  const longPnl = longTrades.reduce((s, t) => s + t.netPnl, 0);
  const shortPnl = shortTrades.reduce((s, t) => s + t.netPnl, 0);
  const longWR = longTrades.length > 0
    ? (longTrades.filter(t => t.status === 'WIN').length / longTrades.length * 100)
    : 0;
  const shortWR = shortTrades.length > 0
    ? (shortTrades.filter(t => t.status === 'WIN').length / shortTrades.length * 100)
    : 0;

  const greenDays = dailyStats.filter(d => d.pnl > 0).length;

  const totalDays = dailyStats.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Deep dive into trading performance</p>
      </div>

      {/* Long vs Short */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Long P&L"
          value={formatCurrency(longPnl)}
          trend={longPnl >= 0 ? 'up' : 'down'}
          icon={<TrendingUp size={16} />}
          subValue={`${longTrades.length} trades · ${longWR.toFixed(0)}% WR`}
        />
        <StatCard
          label="Short P&L"
          value={formatCurrency(shortPnl)}
          trend={shortPnl >= 0 ? 'up' : 'down'}
          icon={<TrendingDown size={16} />}
          subValue={`${shortTrades.length} trades · ${shortWR.toFixed(0)}% WR`}
        />
        <StatCard
          label="Green Days"
          value={`${greenDays} / ${totalDays}`}
          trend="up"
          icon={<Zap size={16} />}
          subValue={`${totalDays > 0 ? ((greenDays / totalDays) * 100).toFixed(0) : 0}% of trading days`}
        />
        <StatCard
          label="Total Fees Paid"
          value={`$${stats.totalFees.toFixed(2)}`}
          trend="neutral"
          icon={<Clock size={16} />}
        />
      </div>

      {/* Equity curve */}
      <EquityChart data={equityCurve} />

      {/* Day of week heatmap */}
      <PerformanceHeatmap dailyStats={dailyStats} />

      {/* Instrument + Strategy breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ByInstrument trades={trades} />
        <ByStrategy trades={trades} />
      </div>
    </div>
  );
}
