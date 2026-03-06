import { useMemo } from 'react';
import type { DailyStats } from '../../types';
import { parseISO, format, getDay } from 'date-fns';
import { formatCurrency } from '../../utils/calculations';

interface Props {
  dailyStats: DailyStats[];
}

export default function PerformanceHeatmap({ dailyStats }: Props) {
  const byDayOfWeek = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const result = days.map(name => ({ name, pnl: 0, trades: 0, wins: 0 }));

    dailyStats.forEach(s => {
      const dow = getDay(parseISO(s.date)); // 0=Sun, 1=Mon...
      if (dow >= 1 && dow <= 5) {
        const idx = dow - 1;
        result[idx].pnl += s.pnl;
        result[idx].trades += s.trades;
        result[idx].wins += s.wins;
      }
    });
    return result;
  }, [dailyStats]);

  const byHour = useMemo(() => {
    const hours: { hour: string; pnl: number; trades: number }[] = [];
    for (let h = 6; h <= 22; h++) {
      hours.push({ hour: `${h}:00`, pnl: 0, trades: 0 });
    }
    // Simplified — would need trade-level time data for real granularity
    return hours;
  }, []);

  const maxPnl = Math.max(...byDayOfWeek.map(d => Math.abs(d.pnl)), 1);

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">P&L by Day of Week</h3>
      <div className="grid grid-cols-5 gap-2">
        {byDayOfWeek.map(d => {
          const intensity = Math.min(Math.abs(d.pnl) / maxPnl, 1);
          const bg = d.pnl > 0
            ? `rgba(34, 197, 94, ${0.1 + intensity * 0.5})`
            : d.pnl < 0
            ? `rgba(239, 68, 68, ${0.1 + intensity * 0.5})`
            : 'rgba(107, 114, 128, 0.1)';

          return (
            <div
              key={d.name}
              className="rounded-lg p-4 text-center border border-border"
              style={{ backgroundColor: bg }}
            >
              <div className="text-xs font-medium text-gray-400 mb-1">{d.name}</div>
              <div className={`text-sm font-bold ${d.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatCurrency(d.pnl)}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {d.trades} trades
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
