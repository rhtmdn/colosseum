import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  winRate: number;
  wins: number;
  losses: number;
  breakeven: number;
}

export default function WinRateDonut({ winRate, wins, losses, breakeven }: Props) {
  const data = [
    { name: 'Wins', value: wins, color: '#22c55e' },
    { name: 'Losses', value: losses, color: '#ef4444' },
    { name: 'Breakeven', value: breakeven, color: '#6b7280' },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Win Rate</h3>
        <div className="h-52 flex items-center justify-center text-gray-600">No data</div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Win Rate</h3>
      <div className="h-52 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{winRate.toFixed(1)}%</span>
          <span className="text-xs text-gray-500">Win Rate</span>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-profit" /> {wins} Wins
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-loss" /> {losses} Losses
        </span>
        {breakeven > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral" /> {breakeven} BE
          </span>
        )}
      </div>
    </div>
  );
}
