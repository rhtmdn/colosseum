import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  List,
  BarChart3,
  PlusCircle,
  Upload,
  Download,
  ChevronDown,
  Plus,
  Trash2,
  X,
  Menu,
  Settings,
} from 'lucide-react';
import type { Portfolio } from '../../types';
import type { SyncStatus } from '../../store/useTradeStore';
import ColosseumLogo from './ColosseumLogo';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/trades', icon: List, label: 'Trade Log' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

interface SidebarProps {
  onAddTrade: () => void;
  onImportCsv: () => void;
  onExport: () => void;
  portfolios: Portfolio[];
  activePortfolio: Portfolio;
  onSwitchPortfolio: (id: string) => void;
  onAddPortfolio: (name: string, color: string, initialBalance: number) => void;
  onDeletePortfolio: (id: string) => void;
  onPortfolioSettings: () => void;
  syncStatus: SyncStatus;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const PORTFOLIO_COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6'];

const SYNC_LABELS: Record<SyncStatus, { color: string; text: string }> = {
  synced: { color: 'bg-profit', text: 'Synced' },
  syncing: { color: 'bg-yellow-500', text: 'Syncing...' },
  error: { color: 'bg-loss', text: 'Sync error' },
  offline: { color: 'bg-gray-500', text: 'Offline' },
};

export default function Sidebar({
  onAddTrade, onImportCsv, onExport, portfolios, activePortfolio,
  onSwitchPortfolio, onAddPortfolio, onDeletePortfolio, onPortfolioSettings,
  syncStatus, mobileOpen, onMobileClose,
}: SidebarProps) {
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [addingPortfolio, setAddingPortfolio] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PORTFOLIO_COLORS[0]);
  const [initialDeposit, setInitialDeposit] = useState<string>('');

  const handleAddPortfolio = () => {
    if (newName.trim()) {
      onAddPortfolio(newName.trim(), newColor, parseFloat(initialDeposit) || 0);
      setNewName('');
      setInitialDeposit('');
      setAddingPortfolio(false);
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ColosseumLogo size={30} />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Colosseum</h1>
              <p className="text-xs text-gray-500 mt-0.5">Trading Dashboard Tracker</p>
            </div>
          </div>
          <button onClick={onMobileClose} className="lg:hidden p-1 text-gray-500 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Portfolio Switcher */}
      <div className="px-3 pt-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setPortfolioOpen(!portfolioOpen)}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-border hover:border-gray-600 transition-colors cursor-pointer"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: activePortfolio.color }}
            />
            <span className="text-sm font-medium text-white truncate flex-1 text-left">
              {activePortfolio.name}
            </span>
            <ChevronDown size={14} className={`text-gray-500 transition-transform ${portfolioOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={onPortfolioSettings}
            className="p-2 rounded-lg bg-surface-2 border border-border hover:border-gray-600 text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Portfolio Settings"
          >
            <Settings size={14} />
          </button>
        </div>

        {portfolioOpen && (
          <div className="mt-1 bg-surface-2 border border-border rounded-lg overflow-hidden">
            {portfolios.map(p => (
              <div
                key={p.id}
                className={`group flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${p.id === activePortfolio.id ? 'bg-accent/10 text-white' : 'text-gray-400 hover:text-white hover:bg-surface-3'
                  }`}
              >
                <button
                  onClick={() => { onSwitchPortfolio(p.id); setPortfolioOpen(false); }}
                  className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                </button>
                {portfolios.length > 1 && (
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (window.confirm('Are you sure you want to delete this portfolio and all its trades?')) {
                        onDeletePortfolio(p.id); 
                      }
                    }}
                    className="p-1 text-gray-600 hover:text-loss rounded cursor-pointer opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                    style={{ opacity: undefined }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '')}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}

            {addingPortfolio ? (
              <div className="p-2 border-t border-border space-y-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Portfolio name"
                  className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                />
                <input
                  type="number"
                  value={initialDeposit}
                  onChange={e => setInitialDeposit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddPortfolio()}
                  placeholder="Initial deposit (optional)"
                  className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                />
                <div className="flex gap-1">
                  {PORTFOLIO_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white/30' : ''
                        }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={handleAddPortfolio} className="flex-1 text-xs bg-accent text-white py-1 rounded cursor-pointer">Add</button>
                  <button onClick={() => setAddingPortfolio(false)} className="flex-1 text-xs text-gray-500 py-1 rounded cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingPortfolio(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-white border-t border-border cursor-pointer transition-colors"
              >
                <Plus size={12} />
                Add Portfolio
              </button>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-accent/15 text-accent-hover'
                : 'text-gray-400 hover:text-gray-200 hover:bg-surface-2'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => { onImportCsv(); onMobileClose(); }}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-2 hover:bg-surface-3 border border-border text-gray-300 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            onClick={() => { onExport(); onMobileClose(); }}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-2 hover:bg-surface-3 border border-border text-gray-300 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Download size={16} />
            Export
          </button>
        </div>
        <button
          onClick={() => { onAddTrade(); onMobileClose(); }}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <PlusCircle size={16} />
          New Trade
        </button>
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${SYNC_LABELS[syncStatus].color}`} />
          <span className="text-[10px] text-gray-600">{SYNC_LABELS[syncStatus].text}</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-surface border-r border-border flex-col h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 w-72 bg-surface border-r border-border flex flex-col h-full">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

// Mobile header bar (exported separately)
export function MobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <div className="lg:hidden sticky top-0 z-40 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
      <button onClick={onMenuOpen} className="p-1 text-gray-400 hover:text-white cursor-pointer">
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-2">
        <ColosseumLogo size={22} />
        <span className="text-sm font-bold text-white">Colosseum</span>
      </div>
    </div>
  );
}
