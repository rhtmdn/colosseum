import { useState } from 'react';
import type { AssetClass, Side } from '../../types';

interface Props {
  onSubmit: (data: {
    portfolioId: string;
    instrument: string;
    assetClass: AssetClass;
    side: Side;
    entryPrice: number;
    exitPrice: number | null;
    quantity: number;
    entryDate: string;
    exitDate: string | null;
    strategy: string;
    setup: string;
    fees: number;
    stopLoss: number | null;
    takeProfit: number | null;
    notes: string;
    tags: string[];
    rating: number;
  }) => void;
  onCancel: () => void;
  strategies: string[];
  activePortfolioId: string;
}

export default function AddTradeForm({ onSubmit, onCancel, strategies, activePortfolioId }: Props) {
  const [form, setForm] = useState({
    instrument: '',
    assetClass: 'Forex' as AssetClass,
    side: 'LONG' as Side,
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    entryDate: new Date().toISOString().slice(0, 16),
    exitDate: '',
    strategy: '',
    setup: 'A',
    fees: '0',
    stopLoss: '',
    takeProfit: '',
    notes: '',
    tags: '',
    rating: '3',
  });

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      portfolioId: activePortfolioId,
      instrument: form.instrument.toUpperCase(),
      assetClass: form.assetClass,
      side: form.side,
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : null,
      quantity: parseFloat(form.quantity),
      entryDate: new Date(form.entryDate).toISOString(),
      exitDate: form.exitDate ? new Date(form.exitDate).toISOString() : null,
      strategy: form.strategy,
      setup: form.setup,
      fees: parseFloat(form.fees) || 0,
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : null,
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : null,
      notes: form.notes,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      rating: parseInt(form.rating),
    });
  };

  const inputClass = "w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors";
  const labelClass = "block text-xs font-medium text-gray-500 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Instrument *</label>
          <input
            required
            value={form.instrument}
            onChange={e => update('instrument', e.target.value)}
            placeholder="XAUUSD"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Asset Class</label>
          <select value={form.assetClass} onChange={e => update('assetClass', e.target.value)} className={inputClass}>
            {['Forex', 'Stocks', 'Futures', 'Options', 'Crypto'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Side *</label>
          <div className="flex gap-2">
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
        <div>
          <label className={labelClass}>Entry Price *</label>
          <input required type="number" step="any" value={form.entryPrice} onChange={e => update('entryPrice', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Exit Price</label>
          <input type="number" step="any" value={form.exitPrice} onChange={e => update('exitPrice', e.target.value)} placeholder="Open" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Quantity *</label>
          <input required type="number" step="any" value={form.quantity} onChange={e => update('quantity', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Stop Loss</label>
          <input type="number" step="any" value={form.stopLoss} onChange={e => update('stopLoss', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Take Profit</label>
          <input type="number" step="any" value={form.takeProfit} onChange={e => update('takeProfit', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Entry Date *</label>
          <input required type="datetime-local" value={form.entryDate} onChange={e => update('entryDate', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Exit Date</label>
          <input type="datetime-local" value={form.exitDate} onChange={e => update('exitDate', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Strategy</label>
          <input value={form.strategy} onChange={e => update('strategy', e.target.value)} list="strategies" placeholder="VWAP Bounce" className={inputClass} />
          <datalist id="strategies">
            {strategies.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div>
          <label className={labelClass}>Setup Grade</label>
          <select value={form.setup} onChange={e => update('setup', e.target.value)} className={inputClass}>
            {['A+', 'A', 'B+', 'B', 'C'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Fees</label>
          <input type="number" step="any" value={form.fees} onChange={e => update('fees', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Rating (1-5)</label>
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
        <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} placeholder="Trade rationale, observations..." className={inputClass + ' resize-none'} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
        <button type="submit" className="px-6 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">Add Trade</button>
      </div>
    </form>
  );
}
