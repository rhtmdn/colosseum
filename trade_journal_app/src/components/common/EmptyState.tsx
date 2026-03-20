import { PlusCircle, Upload, BarChart3 } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  onAddTrade?: () => void;
  onImportCsv?: () => void;
  minTrades?: number;
}

export default function EmptyState({ title, description, onAddTrade, onImportCsv, minTrades }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
        <BarChart3 size={28} className="text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{description}</p>
      {minTrades === undefined && (onAddTrade || onImportCsv) && (
        <div className="flex gap-3">
          {onAddTrade && (
            <button
              onClick={onAddTrade}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle size={16} />
              Add Trade
            </button>
          )}
          {onImportCsv && (
            <button
              onClick={onImportCsv}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface-3 border border-border text-gray-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Upload size={16} />
              Import CSV
            </button>
          )}
        </div>
      )}
    </div>
  );
}
