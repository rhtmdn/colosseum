import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown, Trash2, Eye } from 'lucide-react';
import type { Trade } from '../../types';
import { formatCurrency, pnlColor } from '../../utils/calculations';

interface Props {
  trades: Trade[];
  onView: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

type SortKey = 'entryDate' | 'instrument' | 'side' | 'netPnl' | 'strategy' | 'rMultiple';

export default function TradeTable({ trades, onView, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('entryDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...trades].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'entryDate': cmp = a.entryDate.localeCompare(b.entryDate); break;
      case 'instrument': cmp = a.instrument.localeCompare(b.instrument); break;
      case 'side': cmp = a.side.localeCompare(b.side); break;
      case 'netPnl': cmp = a.netPnl - b.netPnl; break;
      case 'strategy': cmp = a.strategy.localeCompare(b.strategy); break;
      case 'rMultiple': cmp = (a.rMultiple ?? 0) - (b.rMultiple ?? 0); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-gray-300 transition-colors"
      onClick={() => handleSort(k)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className={sortKey === k ? 'text-accent' : 'opacity-30'} />
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full">
        <thead className="bg-surface-2">
          <tr>
            <SortHeader label="Date" k="entryDate" />
            <SortHeader label="Instrument" k="instrument" />
            <SortHeader label="Side" k="side" />
            <SortHeader label="Strategy" k="strategy" />
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Entry</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Exit</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Qty</th>
            <SortHeader label="P&L" k="netPnl" />
            <SortHeader label="R" k="rMultiple" />
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map(trade => (
            <tr key={trade.id} className="bg-surface hover:bg-surface-2 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                {format(parseISO(trade.entryDate), 'MMM d, HH:mm')}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-white">{trade.instrument}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  trade.side === 'LONG' ? 'bg-green-900/40 text-profit' : 'bg-red-900/40 text-loss'
                }`}>
                  {trade.side}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-400">{trade.strategy}</td>
              <td className="px-4 py-3 text-sm text-gray-300 font-mono">{trade.entryPrice.toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-gray-300 font-mono">{trade.exitPrice?.toFixed(2) ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-400">{trade.quantity}</td>
              <td className={`px-4 py-3 text-sm font-bold ${pnlColor(trade.netPnl)}`}>
                {formatCurrency(trade.netPnl)}
              </td>
              <td className={`px-4 py-3 text-sm font-mono ${pnlColor(trade.rMultiple ?? 0)}`}>
                {trade.rMultiple !== null ? `${trade.rMultiple.toFixed(2)}R` : '—'}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  trade.status === 'WIN' ? 'bg-green-900/40 text-profit' :
                  trade.status === 'LOSS' ? 'bg-red-900/40 text-loss' :
                  trade.status === 'OPEN' ? 'bg-blue-900/40 text-blue-400' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {trade.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(trade)}
                    className="p-1.5 rounded hover:bg-surface-3 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(trade.id)}
                    className="p-1.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-loss transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-center py-12 text-gray-600">No trades match your filters</div>
      )}
    </div>
  );
}
