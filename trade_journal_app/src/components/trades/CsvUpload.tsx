import { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Tag, ChevronRight } from 'lucide-react';
import type { Trade } from '../../types';

interface Props {
  onParseCsv: (csvText: string) => Trade[];
  onImport: (trades: Trade[]) => void;
  strategies: string[];
  onClose: () => void;
}

type Step = 'upload' | 'annotate' | 'done';

interface Annotation {
  strategy: string;
  setup: string;
  tags: string;
  notes: string;
}

const SETUPS = ['', 'A', 'B', 'C', 'D'];

export default function CsvUpload({ onParseCsv, onImport, strategies, onClose }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsedTrades, setParsedTrades] = useState<Trade[]>([]);
  const [annotation, setAnnotation] = useState<Annotation>({
    strategy: '',
    setup: '',
    tags: '',
    notes: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreview(text.split('\n').slice(0, 3).join('\n'));
      try {
        const trades = onParseCsv(text);
        if (trades.length === 0) {
          setError('No trades found. Check the file format.');
          return;
        }
        setParsedTrades(trades);
        setStep('annotate');
      } catch {
        setError('Failed to parse CSV. Check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = () => {
    const tagList = annotation.tags
      ? annotation.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const annotated = parsedTrades.map(t => ({
      ...t,
      ...(annotation.strategy && { strategy: annotation.strategy }),
      ...(annotation.setup && { setup: annotation.setup }),
      ...(tagList.length > 0 && { tags: [...t.tags, ...tagList] }),
      ...(annotation.notes && { notes: annotation.notes }),
    }));

    onImport(annotated);
    setStep('done');
  };

  // Summarize what's being imported
  const instruments = [...new Set(parsedTrades.map(t => t.instrument))].slice(0, 5);
  const longs = parsedTrades.filter(t => t.side === 'LONG').length;
  const shorts = parsedTrades.filter(t => t.side === 'SHORT').length;

  return (
    <div className="space-y-4">
      {step === 'upload' && (
        <>
          <p className="text-sm text-gray-400">
            Supports <span className="text-gray-300">MT5</span> and <span className="text-gray-300">IBKR</span> CSV exports.
            Format auto-detected from headers.
          </p>

          {!error ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${dragOver ? 'border-accent bg-accent/10' : 'border-border hover:border-gray-500'}
              `}
            >
              <Upload size={32} className="mx-auto text-gray-500 mb-3" />
              <p className="text-sm text-gray-300 font-medium">Drop CSV file here or click to browse</p>
              <p className="text-xs text-gray-600 mt-1">MT5, MEX Global, IBKR exports</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          ) : (
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6 text-center">
              <AlertCircle size={32} className="mx-auto text-loss mb-3" />
              <p className="text-sm text-loss font-medium">{error}</p>
              <button
                onClick={() => { setError(null); setPreview(null); }}
                className="mt-3 text-xs text-gray-400 hover:text-white cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}

          {preview && (
            <div className="bg-surface-2 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-500">CSV Preview</span>
              </div>
              <pre className="text-[10px] text-gray-400 overflow-x-auto whitespace-pre">{preview}</pre>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white cursor-pointer">
              Cancel
            </button>
          </div>
        </>
      )}

      {step === 'annotate' && (
        <>
          {/* Summary bar */}
          <div className="bg-surface-2 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">{parsedTrades.length} trades parsed</span>
              <span className="text-xs text-gray-500">{longs}L / {shorts}S</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {instruments.map(i => (
                <span key={i} className="text-[11px] bg-surface-3 text-gray-300 px-2 py-0.5 rounded-full">{i}</span>
              ))}
              {[...new Set(parsedTrades.map(t => t.instrument))].length > 5 && (
                <span className="text-[11px] text-gray-500">+{[...new Set(parsedTrades.map(t => t.instrument))].length - 5} more</span>
              )}
            </div>
          </div>

          {/* Annotation fields */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-accent" />
              <span className="text-sm font-medium text-white">Bulk annotate</span>
              <span className="text-xs text-gray-500">— applies to all imported trades (optional)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Strategy</label>
                <select
                  value={annotation.strategy}
                  onChange={e => setAnnotation(a => ({ ...a, strategy: e.target.value }))}
                  className="w-full bg-surface-2 border border-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
                >
                  <option value="">Leave as-is</option>
                  {strategies.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="__custom__" disabled>────</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Setup Grade</label>
                <select
                  value={annotation.setup}
                  onChange={e => setAnnotation(a => ({ ...a, setup: e.target.value }))}
                  className="w-full bg-surface-2 border border-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
                >
                  {SETUPS.map(s => <option key={s} value={s}>{s || 'Leave as-is'}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-400 mb-1">Tags <span className="text-gray-600">(comma-separated)</span></label>
              <input
                type="text"
                value={annotation.tags}
                onChange={e => setAnnotation(a => ({ ...a, tags: e.target.value }))}
                placeholder="e.g. breakout, news-play, review"
                className="w-full bg-surface-2 border border-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent placeholder:text-gray-600"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-400 mb-1">Notes <span className="text-gray-600">(prepended to each trade)</span></label>
              <input
                type="text"
                value={annotation.notes}
                onChange={e => setAnnotation(a => ({ ...a, notes: e.target.value }))}
                placeholder="e.g. Imported from IBKR — Jan batch"
                className="w-full bg-surface-2 border border-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => { setStep('upload'); setParsedTrades([]); }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent/80 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Import {parsedTrades.length} trades
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {step === 'done' && (
        <>
          <div className="bg-green-950/30 border border-green-900/50 rounded-xl p-6 text-center">
            <Check size={32} className="mx-auto text-profit mb-3" />
            <p className="text-lg font-bold text-profit">{parsedTrades.length} trades imported</p>
            {(annotation.strategy || annotation.setup || annotation.tags) && (
              <p className="text-xs text-gray-500 mt-1">
                {[
                  annotation.strategy && `Strategy: ${annotation.strategy}`,
                  annotation.setup && `Setup: ${annotation.setup}`,
                  annotation.tags && `Tags: ${annotation.tags}`,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
            <p className="text-xs text-gray-600 mt-1">Added to your active portfolio</p>
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white cursor-pointer">
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}
