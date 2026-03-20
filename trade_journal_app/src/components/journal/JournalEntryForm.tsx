import { useState } from 'react';
import type { JournalEntry } from '../../types';

interface Props {
  date: string; // yyyy-MM-dd
  existing?: JournalEntry;
  onSave: (entry: JournalEntry) => void;
}

const MOODS = ['😤', '😕', '😐', '🙂', '🔥'];

export default function JournalEntryForm({ date, existing, onSave }: Props) {
  const [form, setForm] = useState({
    preMarket: existing?.preMarket ?? '',
    postMarket: existing?.postMarket ?? '',
    mood: existing?.mood ?? 3,
    lessons: existing?.lessons ?? '',
    mistakes: existing?.mistakes ?? '',
    marketContext: existing?.marketContext ?? '',
    bias: existing?.bias ?? '' as JournalEntry['bias'],
    keyLevels: existing?.keyLevels ?? '',
  });

  const update = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = () => {
    onSave({
      id: existing?.id ?? crypto.randomUUID(),
      date,
      ...form,
    });
  };

  const inputClass = "w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors";
  const labelClass = "block text-xs font-medium text-gray-500 mb-1.5";

  return (
    <div className="space-y-4">
      {/* Mood */}
      <div>
        <label className={labelClass}>Mood</label>
        <div className="flex gap-2">
          {MOODS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => update('mood', i + 1)}
              className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${
                form.mood === i + 1
                  ? 'bg-accent/20 border-2 border-accent scale-110'
                  : 'bg-surface-2 border border-border hover:border-gray-600'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Bias + Market Context */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Bias</label>
          <div className="flex gap-1.5">
            {(['BULLISH', 'BEARISH', 'NEUTRAL'] as const).map(b => (
              <button
                key={b}
                type="button"
                onClick={() => update('bias', form.bias === b ? '' : b)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  form.bias === b
                    ? b === 'BULLISH' ? 'bg-green-900/40 text-profit border border-green-800'
                    : b === 'BEARISH' ? 'bg-red-900/40 text-loss border border-red-800'
                    : 'bg-gray-800 text-gray-300 border border-gray-700'
                    : 'bg-surface-2 text-gray-500 border border-border hover:border-gray-600'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Key Levels</label>
          <input
            value={form.keyLevels}
            onChange={e => update('keyLevels', e.target.value)}
            placeholder="PDH 2350, PDL 2320, VWAP 2335"
            className={inputClass}
          />
        </div>
      </div>

      {/* Pre-Market */}
      <div>
        <label className={labelClass}>Pre-Market Thesis</label>
        <textarea
          value={form.preMarket}
          onChange={e => update('preMarket', e.target.value)}
          rows={2}
          placeholder="What's the plan today? Key setups, session expectations..."
          className={inputClass + ' resize-none'}
        />
      </div>

      {/* Market Context */}
      <div>
        <label className={labelClass}>Market Context</label>
        <textarea
          value={form.marketContext}
          onChange={e => update('marketContext', e.target.value)}
          rows={2}
          placeholder="Session type, overnight ranges, macro events..."
          className={inputClass + ' resize-none'}
        />
      </div>

      {/* Post-Market */}
      <div>
        <label className={labelClass}>Post-Market Review</label>
        <textarea
          value={form.postMarket}
          onChange={e => update('postMarket', e.target.value)}
          rows={2}
          placeholder="How did the session go? What worked, what didn't?"
          className={inputClass + ' resize-none'}
        />
      </div>

      {/* Lessons + Mistakes */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Lessons</label>
          <textarea
            value={form.lessons}
            onChange={e => update('lessons', e.target.value)}
            rows={2}
            placeholder="What did you learn?"
            className={inputClass + ' resize-none'}
          />
        </div>
        <div>
          <label className={labelClass}>Mistakes</label>
          <textarea
            value={form.mistakes}
            onChange={e => update('mistakes', e.target.value)}
            rows={2}
            placeholder="What to avoid next time?"
            className={inputClass + ' resize-none'}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
      >
        {existing ? 'Update Journal Entry' : 'Save Journal Entry'}
      </button>
    </div>
  );
}
