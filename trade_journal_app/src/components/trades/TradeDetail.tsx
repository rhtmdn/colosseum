import { format, parseISO } from 'date-fns';
import type { Trade } from '../../types';
import { formatCurrency, pnlColor } from '../../utils/calculations';

interface Props {
  trade: Trade;
}

export default function TradeDetail({ trade }: Props) {
  const fields = [
    { label: 'Instrument', value: trade.instrument },
    { label: 'Asset Class', value: trade.assetClass },
    { label: 'Side', value: trade.side, color: trade.side === 'LONG' ? 'text-profit' : 'text-loss' },
    { label: 'Status', value: trade.status },
    { label: 'Entry Price', value: trade.entryPrice.toFixed(2) },
    { label: 'Exit Price', value: trade.exitPrice?.toFixed(2) ?? 'Open' },
    { label: 'Quantity', value: trade.quantity.toString() },
    { label: 'Entry Date', value: format(parseISO(trade.entryDate), 'MMM d, yyyy HH:mm') },
    { label: 'Exit Date', value: trade.exitDate ? format(parseISO(trade.exitDate), 'MMM d, yyyy HH:mm') : '—' },
    { label: 'Strategy', value: trade.strategy || '—' },
    { label: 'Setup Grade', value: trade.setup || '—' },
    { label: 'Stop Loss', value: trade.stopLoss?.toFixed(2) ?? '—' },
    { label: 'Take Profit', value: trade.takeProfit?.toFixed(2) ?? '—' },
  ];

  return (
    <div className="space-y-6">
      {/* PnL hero */}
      <div className="text-center py-4">
        <div className={`text-4xl font-bold ${pnlColor(trade.netPnl)}`}>
          {formatCurrency(trade.netPnl)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Gross: {formatCurrency(trade.pnl)} · Fees: ${trade.fees.toFixed(2)}
          {trade.rMultiple !== null && (
            <> · <span className={pnlColor(trade.rMultiple)}>{trade.rMultiple.toFixed(2)}R</span></>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ label, value, color }) => (
          <div key={label} className="bg-surface-2 rounded-lg px-4 py-3">
            <div className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">{label}</div>
            <div className={`text-sm font-medium mt-0.5 ${color || 'text-white'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Rating */}
      <div className="bg-surface-2 rounded-lg px-4 py-3">
        <div className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Rating</div>
        <div className="text-sm mt-0.5">
          {'★'.repeat(trade.rating)}{'☆'.repeat(5 - trade.rating)}
        </div>
      </div>

      {/* Tags */}
      {trade.tags.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {trade.tags.map(tag => (
              <span key={tag} className="bg-accent/15 text-accent text-xs px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">Notes</div>
          <div className="bg-surface-2 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">
            {trade.notes}
          </div>
        </div>
      )}
    </div>
  );
}
