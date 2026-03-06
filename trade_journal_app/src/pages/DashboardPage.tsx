import { TrendingUp, TrendingDown, Target, DollarSign, BarChart2, Activity } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import EquityChart from '../components/dashboard/EquityChart';
import PnlBarChart from '../components/dashboard/PnlBarChart';
import WinRateDonut from '../components/dashboard/WinRateDonut';
import type { Trade, PortfolioStats, DailyStats } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  trades: Trade[];
  stats: PortfolioStats;
  dailyStats: DailyStats[];
  equityCurve: { date: string; equity: number }[];
}

export default function DashboardPage({ trades, stats, dailyStats, equityCurve }: Props) {
  const closed = trades.filter(t => t.status !== 'OPEN');
  const wins = closed.filter(t => t.status === 'WIN').length;
  const losses = closed.filter(t => t.status === 'LOSS').length;
  const breakeven = closed.filter(t => t.status === 'BREAKEVEN').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Performance overview across all trades</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total P&L"
          value={formatCurrency(stats.totalPnl)}
          trend={stats.totalPnl >= 0 ? 'up' : 'down'}
          icon={<DollarSign size={16} />}
          subValue={`${stats.totalTrades} trades`}
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          trend={stats.winRate >= 50 ? 'up' : 'down'}
          icon={<Target size={16} />}
          subValue={`${wins}W / ${losses}L`}
        />
        <StatCard
          label="Profit Factor"
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
          trend={stats.profitFactor >= 1 ? 'up' : 'down'}
          icon={<BarChart2 size={16} />}
        />
        <StatCard
          label="Avg Win"
          value={formatCurrency(stats.avgWin)}
          trend="up"
          icon={<TrendingUp size={16} />}
          subValue={`Best: ${formatCurrency(stats.largestWin)}`}
        />
        <StatCard
          label="Avg Loss"
          value={`-$${stats.avgLoss.toFixed(2)}`}
          trend="down"
          icon={<TrendingDown size={16} />}
          subValue={`Worst: ${formatCurrency(stats.largestLoss)}`}
        />
        <StatCard
          label="Expectancy"
          value={formatCurrency(stats.expectancy)}
          trend={stats.expectancy >= 0 ? 'up' : 'down'}
          icon={<Activity size={16} />}
          subValue={`Avg R: ${stats.avgRMultiple.toFixed(2)}`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EquityChart data={equityCurve} />
        </div>
        <WinRateDonut
          winRate={stats.winRate}
          wins={wins}
          losses={losses}
          breakeven={breakeven}
        />
      </div>

      {/* Daily PnL bar */}
      <PnlBarChart data={dailyStats} />

      {/* Stats detail row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Max Drawdown"
          value={`-$${stats.maxDrawdown.toFixed(2)}`}
          trend="down"
        />
        <StatCard
          label="Sharpe Ratio"
          value={stats.sharpeRatio.toFixed(2)}
          trend={stats.sharpeRatio >= 1 ? 'up' : stats.sharpeRatio >= 0 ? 'neutral' : 'down'}
        />
        <StatCard
          label="Consecutive Wins"
          value={stats.maxConsecutiveWins.toString()}
          trend="up"
        />
        <StatCard
          label="Consecutive Losses"
          value={stats.maxConsecutiveLosses.toString()}
          trend="down"
        />
      </div>

      {/* Best / Worst day */}
      <div className="grid grid-cols-2 gap-4">
        {stats.bestDay && (
          <StatCard
            label="Best Day"
            value={formatCurrency(stats.bestDay.pnl)}
            subValue={stats.bestDay.date}
            trend="up"
          />
        )}
        {stats.worstDay && (
          <StatCard
            label="Worst Day"
            value={formatCurrency(stats.worstDay.pnl)}
            subValue={stats.worstDay.date}
            trend="down"
          />
        )}
      </div>
    </div>
  );
}
