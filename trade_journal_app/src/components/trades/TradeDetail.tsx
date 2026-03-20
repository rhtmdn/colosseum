import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Pencil } from 'lucide-react';
import type { Trade, AssetClass, Side } from '../../types';
import { formatCurrency, pnlColor, formatPrice } from '../../utils/calculations';

interface Props {
  trade: Trade;
  onUpdate?: (id: string, updates: Partial<Trade>) => void;
  strategies?: string[];
}

export default function TradeDetail({ trade, onUpdate, strategies = [] }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    instrument: trade.instrument,
    assetClass: trade.assetClass,
    side: trade.side,
    entryPrice: trade.entryPrice.toString(),
    exitPrice: trade.exitPrice?.toString() ?? '',
    quantity: trade.quantity.toString(),
    entryDate: trade.entryDate.slice(0, 16),
    exitDate: trade.exitDate?.slice(0, 16) ?? '',
    strategy: trade.strategy,
    setup: trade.setup,
    fees: trade.fees.toString(),
    stopLoss: trade.stopLoss?.toString() ?? '',
    takeProfit: trade.takeProfit?.toString() ?? '',
    notes: trade.notes,
    tags: trade.tags.join(', '),
    rating: trade.rating.toString(),
  }));

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!onUpdate) return;

    const entryPrice = parseFloat(form.entryPrice);
    const exitPrice = form.exitPrice ? parseFloat(form.exitPrice) : null;
    const quantity = parseFloat(form.quantity);
    const fees = parseFloat(form.fees) || 0;
    const stopLoss = form.stopLoss ? parseFloat(form.stopLoss) : null;
    const takeProfit = form.takeProfit ? parseFloat(form.takeProfit) : null;
    const side = form.side;

    // Recalculate derived fields
    const pnl = exitPrice !== null
      ? (side === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice) * quantity
      : 0;
    const netPnl = pnl - fees;

    let rMultiple: number | null = null;
    if (stopLoss !== null && exitPrice !== null) {
      const risk = Math.abs(entryPrice - stopLoss);
      if (risk > 0) {
        const reward = side === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;
        rMultiple = reward / risk;
      }
    }

    const status = exitPrice === null ? 'OPEN' as const
      : pnl > 0 ? 'WIN' as const
      : pnl < 0 ? 'LOSS' as const
      : 'BREAKEVEN' as const;

    onUpdate(trade.id, {
      instrument: form.instrument.toUpperCase(),
      assetClass: form.assetClass as AssetClass,
      side: form.side as Side,
      entryPrice,
      exitPrice,
      quantity,
      entryDate: new Date(form.entryDate).toISOString(),
      exitDate: form.exitDate ? new Date(form.exitDate).toISOString() : null,
      strategy: form.strategy,
      setup: form.setup,
      fees,
      stopLoss,
      takeProfit,
      notes: form.notes,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      rating: parseInt(form.rating),
      pnl,
      netPnl,
      rMultiple,
      status,
    });
    setEditing(false);
  };

  const inputClass = "w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors";
  const labelClass = "text-[10px] font-medium text-gray-600 uppercase tracking-wider";

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Instrument</label>
            <input value={form.instrument} onChange={e => update('instrument', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Asset Class</label>
            <select value={form.assetClass} onChange={e => update('assetClass', e.target.value)} className={inputClass}>
              {['Forex', 'Stocks', 'Futures', 'Options', 'Crypto'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Side</label>
          <div className="flex gap-2 mt-1">
            {(['LONG', 'SHORT'] as Side[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => update('side', s)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  form.side === s
                    ? s === 'LONG' ? 'bg-green-900/40 text-profit border border-green-800' : 'bg-red-900/40 text-loss border border-red-800'
                    : 'bg-surface-2 text-gray-500 border border-border hover:border-gray-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Entry Price</label>
            <input type="number" step="any" value={form.entryPrice} onChange={e => update('entryPrice', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Exit Price</label>
            <input type="number" step="any" value={form.exitPrice} onChange={e => update('exitPrice', e.target.value)} placeholder="Open" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Quantity</label>
            <input type="number" step="any" value={form.quantity} onChange={e => update('quantity', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Stop Loss</label>
            <input type="number" step="any" value={form.stopLoss} onChange={e => update('stopLoss', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Take Profit</label>
            <input type="number" step="any" value={form.takeProfit} onChange={e => update('takeProfit', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Entry Date</label>
            <input type="datetime-local" value={form.entryDate} onChange={e => update('entryDate', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Exit Date</label>
            <input type="datetime-local" value={form.exitDate} onChange={e => update('exitDate', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Strategy</label>
            <input value={form.strategy} onChange={e => update('strategy', e.target.value)} list="edit-strategies" className={inputClass} />
            <datalist id="edit-strategies">
              {strategies.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>Setup Grade</label>
            <select value={form.setup} onChange={e => update('setup', e.target.value)} className={inputClass}>
              <option value="">—</option>
              {['A+', 'A', 'B+', 'B', 'C'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Fees</label>
            <input type="number" step="any" value={form.fees} onChange={e => update('fees', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Rating</label>
            <select value={form.rating} onChange={e => update('rating', e.target.value)} className={inputClass}>
              {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} {'★'.repeat(r)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tags</label>
            <input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="AMT, Sweep" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} className={inputClass + ' resize-none'} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">Save</button>
        </div>
      </div>
    );
  }

  const fields = [
    { label: 'Instrument', value: trade.instrument },
    { label: 'Asset Class', value: trade.assetClass },
    { label: 'Side', value: trade.side, color: trade.side === 'LONG' ? 'text-profit' : 'text-loss' },
    { label: 'Status', value: trade.status },
    { label: 'Entry Price', value: formatPrice(trade.entryPrice, trade.instrument) },
    { label: 'Exit Price', value: trade.exitPrice !== null ? formatPrice(trade.exitPrice, trade.instrument) : 'Open' },
    { label: 'Quantity', value: trade.quantity.toString() },
    { label: 'Entry Date', value: format(parseISO(trade.entryDate), 'MMM d, yyyy HH:mm') },
    { label: 'Exit Date', value: trade.exitDate ? format(parseISO(trade.exitDate), 'MMM d, yyyy HH:mm') : '—' },
    { label: 'Strategy', value: trade.strategy || '—' },
    { label: 'Setup Grade', value: trade.setup || '—' },
    { label: 'Stop Loss', value: trade.stopLoss !== null ? formatPrice(trade.stopLoss, trade.instrument) : '—' },
    { label: 'Take Profit', value: trade.takeProfit !== null ? formatPrice(trade.takeProfit, trade.instrument) : '—' },
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

      {/* Edit button */}
      {onUpdate && (
        <button
          onClick={() => setEditing(true)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-400 hover:text-white bg-surface-2 hover:bg-surface-3 border border-border rounded-lg transition-colors cursor-pointer"
        >
          <Pencil size={14} />
          Edit Trade
        </button>
      )}

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
