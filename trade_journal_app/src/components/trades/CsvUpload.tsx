import { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';

interface Props {
  onImport: (csvText: string) => number;
  onClose: () => void;
}

export default function CsvUpload({ onImport, onClose }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{ count: number; error?: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setResult({ count: 0, error: 'Please upload a .csv file' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreview(text.split('\n').slice(0, 4).join('\n'));

      try {
        const count = onImport(text);
        setResult({ count });
      } catch {
        setResult({ count: 0, error: 'Failed to parse CSV. Check the format.' });
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Upload a CSV export from MT5, MEX Global, or any broker. Expected columns:
        <span className="text-gray-300"> Type, Symbol, Open Time, Close Time, Volume, Open Price, Close Price, Profit</span>
      </p>

      {!result ? (
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
          <p className="text-sm text-gray-300 font-medium">
            Drop CSV file here or click to browse
          </p>
          <p className="text-xs text-gray-600 mt-1">Supports MT5, MEX Global exports</p>
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
      ) : result.error ? (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-loss mb-3" />
          <p className="text-sm text-loss font-medium">{result.error}</p>
          <button
            onClick={() => { setResult(null); setPreview(null); }}
            className="mt-3 text-xs text-gray-400 hover:text-white cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="bg-green-950/30 border border-green-900/50 rounded-xl p-6 text-center">
          <Check size={32} className="mx-auto text-profit mb-3" />
          <p className="text-lg font-bold text-profit">{result.count} trades imported</p>
          <p className="text-xs text-gray-500 mt-1">Added to your active portfolio</p>
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
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          {result && !result.error ? 'Done' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
