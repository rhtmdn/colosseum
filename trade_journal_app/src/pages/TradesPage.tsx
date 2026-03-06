import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import TradeTable from '../components/trades/TradeTable';
import TradeDetail from '../components/trades/TradeDetail';
import Modal from '../components/common/Modal';
import type { Trade, FilterState, Side, AssetClass, TradeStatus } from '../types';

interface Props {
  trades: Trade[];
  filter: FilterState;
  setFilter: (f: FilterState) => void;
  onDelete: (id: string) => void;
  instruments: string[];
  strategies: string[];
}

export default function TradesPage({ trades, filter, setFilter, onDelete, instruments, strategies }: Props) {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const searched = search
    ? trades.filter(t =>
        t.instrument.toLowerCase().includes(search.toLowerCase()) ||
        t.strategy.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      )
    : trades;

  const selectClass = "bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trade Log</h1>
          <p className="text-sm text-gray-500 mt-1">{trades.length} trades total</p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search instrument, strategy, tag..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            showFilters ? 'bg-accent text-white' : 'bg-surface border border-border text-gray-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-surface border border-border rounded-xl p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Side</label>
            <select
              value={filter.sides[0] || ''}
              onChange={e => setFilter({ ...filter, sides: e.target.value ? [e.target.value as Side] : [] })}
              className={selectClass + ' w-full'}
            >
              <option value="">All</option>
              <option value="LONG">Long</option>
              <option value="SHORT">Short</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Instrument</label>
            <select
              value={filter.instruments[0] || ''}
              onChange={e => setFilter({ ...filter, instruments: e.target.value ? [e.target.value] : [] })}
              className={selectClass + ' w-full'}
            >
              <option value="">All</option>
              {instruments.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Strategy</label>
            <select
              value={filter.strategies[0] || ''}
              onChange={e => setFilter({ ...filter, strategies: e.target.value ? [e.target.value] : [] })}
              className={selectClass + ' w-full'}
            >
              <option value="">All</option>
              {strategies.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select
              value={filter.status[0] || ''}
              onChange={e => setFilter({ ...filter, status: e.target.value ? [e.target.value as TradeStatus] : [] })}
              className={selectClass + ' w-full'}
            >
              <option value="">All</option>
              <option value="WIN">Win</option>
              <option value="LOSS">Loss</option>
              <option value="BREAKEVEN">Breakeven</option>
              <option value="OPEN">Open</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">From</label>
            <input
              type="date"
              value={filter.dateFrom}
              onChange={e => setFilter({ ...filter, dateFrom: e.target.value })}
              className={selectClass + ' w-full'}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">To</label>
            <input
              type="date"
              value={filter.dateTo}
              onChange={e => setFilter({ ...filter, dateTo: e.target.value })}
              className={selectClass + ' w-full'}
            />
          </div>
          <div className="col-span-2 flex items-end">
            <button
              onClick={() => setFilter({ dateFrom: '', dateTo: '', instruments: [], strategies: [], sides: [], assetClasses: [], status: [], tags: [] })}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <TradeTable
        trades={searched}
        onView={setSelectedTrade}
        onDelete={onDelete}
      />

      <Modal
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
        title="Trade Detail"
        width="max-w-lg"
      >
        {selectedTrade && <TradeDetail trade={selectedTrade} />}
      </Modal>
    </div>
  );
}
