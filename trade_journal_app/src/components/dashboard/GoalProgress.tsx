import { Target, TrendingDown, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Goals, DailyStats } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface Props {
  goals: Goals;
  totalPnl: number;
  maxDrawdown: number;
  dailyStats: DailyStats[];
}

function ProgressBar({ value, max, color, danger }: { value: number; max: number; color: string; danger?: boolean }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${danger ? 'bg-loss' : color}`}
        style={{ width: `${Math.max(pct, 0)}%` }}
      />
    </div>
  );
}

export default function GoalProgress({ goals, totalPnl, maxDrawdown, dailyStats }: Props) {
  const profitHit = totalPnl >= goals.profitTarget && goals.profitTarget > 0;

  // Worst single-day loss
  const worstDayLoss = dailyStats.length > 0
    ? Math.min(...dailyStats.map(d => d.pnl), 0)
    : 0;
  const dailyLossBreach = goals.maxDailyLoss > 0 && Math.abs(worstDayLoss) >= goals.maxDailyLoss;

  const drawdownBreach = goals.maxTotalLoss > 0 && maxDrawdown >= goals.maxTotalLoss;

  const tradingDays = dailyStats.length;
  const tradingDaysMet = tradingDays >= goals.minTradingDays && goals.minTradingDays > 0;

  const anyBreach = dailyLossBreach || drawdownBreach;

  return (
    <div className="bg-surface-2 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Target size={16} className="text-accent" />
          Challenge Progress
        </h3>
        {anyBreach && (
          <span className="flex items-center gap-1 text-xs font-medium text-loss bg-loss/10 px-2 py-0.5 rounded-full">
            <AlertTriangle size={12} />
            Limit Breached
          </span>
        )}
        {!anyBreach && profitHit && tradingDaysMet && (
          <span className="flex items-center gap-1 text-xs font-medium text-profit bg-profit/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={12} />
            Target Hit
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Profit Target */}
        {goals.profitTarget > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <TrendingDown size={12} className="rotate-180" />
                Profit Target
              </span>
              <span className={`text-xs font-medium ${profitHit ? 'text-profit' : 'text-white'}`}>
                {formatCurrency(totalPnl)} / {formatCurrency(goals.profitTarget)}
              </span>
            </div>
            <ProgressBar value={Math.max(totalPnl, 0)} max={goals.profitTarget} color="bg-profit" />
            <p className="text-[11px] text-gray-500 mt-1">
              {profitHit ? 'Target reached!' : `${formatCurrency(goals.profitTarget - totalPnl)} remaining`}
            </p>
          </div>
        )}

        {/* Daily Loss Limit */}
        {goals.maxDailyLoss > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Daily Loss Limit
              </span>
              <span className={`text-xs font-medium ${dailyLossBreach ? 'text-loss' : 'text-white'}`}>
                {formatCurrency(Math.abs(worstDayLoss))} / {formatCurrency(goals.maxDailyLoss)}
              </span>
            </div>
            <ProgressBar value={Math.abs(worstDayLoss)} max={goals.maxDailyLoss} color="bg-amber-500" danger={dailyLossBreach} />
            <p className="text-[11px] text-gray-500 mt-1">
              {dailyLossBreach ? 'Daily limit breached!' : `Worst day: ${formatCurrency(worstDayLoss)}`}
            </p>
          </div>
        )}

        {/* Max Drawdown */}
        {goals.maxTotalLoss > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <TrendingDown size={12} />
                Max Drawdown Limit
              </span>
              <span className={`text-xs font-medium ${drawdownBreach ? 'text-loss' : 'text-white'}`}>
                {formatCurrency(maxDrawdown)} / {formatCurrency(goals.maxTotalLoss)}
              </span>
            </div>
            <ProgressBar value={maxDrawdown} max={goals.maxTotalLoss} color="bg-amber-500" danger={drawdownBreach} />
            <p className="text-[11px] text-gray-500 mt-1">
              {drawdownBreach ? 'Drawdown limit breached!' : `${formatCurrency(goals.maxTotalLoss - maxDrawdown)} buffer remaining`}
            </p>
          </div>
        )}

        {/* Trading Days */}
        {goals.minTradingDays > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Calendar size={12} />
                Trading Days
              </span>
              <span className={`text-xs font-medium ${tradingDaysMet ? 'text-profit' : 'text-white'}`}>
                {tradingDays} / {goals.minTradingDays}
              </span>
            </div>
            <ProgressBar value={tradingDays} max={goals.minTradingDays} color="bg-accent" />
            <p className="text-[11px] text-gray-500 mt-1">
              {tradingDaysMet ? 'Minimum met!' : `${goals.minTradingDays - tradingDays} more days needed`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
