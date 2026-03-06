import { useMemo } from 'react';
import type { Trade } from '../../types';
import { formatCurrency, pnlColor } from '../../utils/calculations';

interface Props {
  trades: Trade[];
}

export default function ByStrategy({ trades }: Props) {
  const data = useMemo(() => {
    const map = new Map<string, { strategy: string; pnl: number; trades: number; wins: number; losses: number; avgR: number; rCount: number }>();
    trades.filter(t => t.status !== 'OPEN').forEach(t => {
      const key = t.strategy || 'Uncategorized';
      const existing = map.get(key) || { strategy: key, pnl: 0, trades: 0, wins: 0, losses: 0, avgR: 0, rCount: 0 };
      existing.pnl += t.netPnl;
      existing.trades++;
      if (t.status === 'WIN') existing.wins++;
      if (t.status === 'LOSS') existing.losses++;
      if (t.rMultiple !== null) {
        existing.avgR += t.rMultiple;
        existing.rCount++;
      }
      map.set(key, existing);
    });
    return Array.from(map.values())
      .map(d => ({
        ...d,
        winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0,
        avgR: d.rCount > 0 ? d.avgR / d.rCount : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Performance by Strategy</h3>
      <div className="space-y-3">
        {data.map(d => (
          <div key={d.strategy} className="bg-surface-2 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white">{d.strategy}</span>
              <span className={`text-lg font-bold ${pnlColor(d.pnl)}`}>{formatCurrency(d.pnl)}</span>
            </div>
            <div className="flex gap-6 text-xs text-gray-500">
              <span>{d.trades} trades</span>
              <span className="text-profit">{d.wins}W</span>
              <span className="text-loss">{d.losses}L</span>
              <span>{d.winRate.toFixed(0)}% WR</span>
              <span className={pnlColor(d.avgR)}>Avg {d.avgR.toFixed(2)}R</span>
            </div>
            {/* Win rate bar */}
            <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-profit rounded-full"
                style={{ width: `${d.winRate}%` }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="text-center py-8 text-gray-600">No data</div>}
      </div>
    </div>
  );
}
