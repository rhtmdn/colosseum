import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { Trade } from '../../types';
import { formatCurrency, pnlColor } from '../../utils/calculations';

interface Props {
  trades: Trade[];
}

export default function ByInstrument({ trades }: Props) {
  const data = useMemo(() => {
    const map = new Map<string, { instrument: string; pnl: number; trades: number; wins: number }>();
    trades.filter(t => t.status !== 'OPEN').forEach(t => {
      const existing = map.get(t.instrument) || { instrument: t.instrument, pnl: 0, trades: 0, wins: 0 };
      existing.pnl += t.netPnl;
      existing.trades++;
      if (t.status === 'WIN') existing.wins++;
      map.set(t.instrument, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">P&L by Instrument</h3>
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `$${v.toLocaleString()}`}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="instrument"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              width={70}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
            />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5">
        {data.map(d => (
          <div key={d.instrument} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-surface-2">
            <span className="font-medium text-white">{d.instrument}</span>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-xs">{d.trades} trades · {((d.wins / d.trades) * 100).toFixed(0)}% WR</span>
              <span className={`font-bold ${pnlColor(d.pnl)}`}>{formatCurrency(d.pnl)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
