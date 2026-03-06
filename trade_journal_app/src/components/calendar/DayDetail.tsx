import { format, parseISO } from 'date-fns';
import type { Trade } from '../../types';
import { formatCurrency, pnlColor } from '../../utils/calculations';

interface Props {
  date: string;
  trades: Trade[];
  onTradeClick: (trade: Trade) => void;
}

export default function DayDetail({ date, trades, onTradeClick }: Props) {
  const totalPnl = trades.reduce((s, t) => s + t.netPnl, 0);
  const wins = trades.filter(t => t.status === 'WIN').length;
  const losses = trades.filter(t => t.status === 'LOSS').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
          </h3>
          <div className="flex gap-4 mt-1 text-sm">
            <span className={pnlColor(totalPnl)}>{formatCurrency(totalPnl)}</span>
            <span className="text-gray-500">{trades.length} trades</span>
            <span className="text-profit">{wins}W</span>
            <span className="text-loss">{losses}L</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {trades.map(trade => (
          <button
            key={trade.id}
            onClick={() => onTradeClick(trade)}
            className="w-full text-left bg-surface-2 hover:bg-surface-3 rounded-lg p-3 transition-colors cursor-pointer border border-border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  trade.side === 'LONG' ? 'bg-green-900/40 text-profit' : 'bg-red-900/40 text-loss'
                }`}>
                  {trade.side}
                </span>
                <span className="font-semibold text-white">{trade.instrument}</span>
                <span className="text-xs text-gray-500">{trade.strategy}</span>
              </div>
              <span className={`font-bold ${pnlColor(trade.netPnl)}`}>
                {formatCurrency(trade.netPnl)}
              </span>
            </div>
            <div className="mt-1.5 flex gap-4 text-xs text-gray-500">
              <span>Entry: {trade.entryPrice.toFixed(2)}</span>
              <span>Exit: {trade.exitPrice?.toFixed(2) ?? '—'}</span>
              <span>Qty: {trade.quantity}</span>
              {trade.rMultiple !== null && (
                <span className={pnlColor(trade.rMultiple)}>
                  {trade.rMultiple.toFixed(2)}R
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
