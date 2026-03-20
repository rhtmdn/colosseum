import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { BookOpen, ChevronDown } from 'lucide-react';
import type { Trade, JournalEntry } from '../../types';
import { formatCurrency, pnlColor, formatPrice } from '../../utils/calculations';
import JournalEntryForm from '../journal/JournalEntryForm';

interface Props {
  date: string;
  trades: Trade[];
  onTradeClick: (trade: Trade) => void;
  journalEntry?: JournalEntry;
  onSaveJournal: (entry: JournalEntry) => void;
}

const MOODS = ['😤', '😕', '😐', '🙂', '🔥'];

export default function DayDetail({ date, trades, onTradeClick, journalEntry, onSaveJournal }: Props) {
  const totalPnl = trades.reduce((s, t) => s + t.netPnl, 0);
  const wins = trades.filter(t => t.status === 'WIN').length;
  const losses = trades.filter(t => t.status === 'LOSS').length;
  const [showJournal, setShowJournal] = useState(!journalEntry && trades.length > 0);

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

      {/* Trades list */}
      {trades.length > 0 && (
        <div className="space-y-2 mb-4">
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
                <span>Entry: {formatPrice(trade.entryPrice, trade.instrument)}</span>
                <span>Exit: {trade.exitPrice !== null ? formatPrice(trade.exitPrice, trade.instrument) : '—'}</span>
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
      )}

      {/* Journal section */}
      <div className="border-t border-border pt-4">
        {journalEntry && !showJournal ? (
          <div>
            <button
              onClick={() => setShowJournal(true)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-accent" />
                <span className="text-sm font-medium text-white">Journal Entry</span>
                <span className="text-lg">{MOODS[journalEntry.mood - 1]}</span>
                {journalEntry.bias && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    journalEntry.bias === 'BULLISH' ? 'bg-green-900/40 text-profit' :
                    journalEntry.bias === 'BEARISH' ? 'bg-red-900/40 text-loss' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {journalEntry.bias}
                  </span>
                )}
              </div>
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            {/* Preview */}
            {journalEntry.postMarket && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{journalEntry.postMarket}</p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-accent" />
              <span className="text-sm font-medium text-white">
                {journalEntry ? 'Edit Journal Entry' : 'Add Journal Entry'}
              </span>
              {journalEntry && (
                <button
                  onClick={() => setShowJournal(false)}
                  className="ml-auto text-xs text-gray-500 hover:text-white cursor-pointer"
                >
                  Collapse
                </button>
              )}
            </div>
            <JournalEntryForm
              date={date}
              existing={journalEntry}
              onSave={(entry) => {
                onSaveJournal(entry);
                setShowJournal(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
