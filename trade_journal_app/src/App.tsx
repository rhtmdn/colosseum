import { useState, useMemo } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar, { MobileHeader } from './components/layout/Sidebar';
import Modal from './components/common/Modal';
import ErrorBoundary from './components/common/ErrorBoundary';
import AddTradeForm from './components/trades/AddTradeForm';
import CsvUpload from './components/trades/CsvUpload';
import PortfolioSettingsModal from './components/layout/PortfolioSettingsModal';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import TradesPage from './pages/TradesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { useTradeStore } from './store/useTradeStore';
import { exportTradesToCsv, exportFullBackup } from './utils/export';
import { useKeyboardShortcuts, SHORTCUTS } from './hooks/useKeyboardShortcuts';

export default function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </HashRouter>
  );
}

function AppContent() {
  const store = useTradeStore();
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [showImportCsv, setShowImportCsv] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPortfolioSettings, setShowPortfolioSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const shortcutActions = useMemo(() => ({
    onAddTrade: () => setShowAddTrade(true),
    onImportCsv: () => setShowImportCsv(true),
    onExport: () => setShowExport(true),
    onToggleHelp: () => setShowShortcuts(s => !s),
  }), []);

  useKeyboardShortcuts(shortcutActions);

  return (
    <>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar
          onAddTrade={() => setShowAddTrade(true)}
          onImportCsv={() => setShowImportCsv(true)}
          onExport={() => setShowExport(true)}
          portfolios={store.portfolios}
          activePortfolio={store.activePortfolio}
          onSwitchPortfolio={store.setActivePortfolioId}
          onAddPortfolio={store.addPortfolio}
          onDeletePortfolio={store.deletePortfolio}
          onPortfolioSettings={() => setShowPortfolioSettings(true)}
          syncStatus={store.syncStatus}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileHeader onMenuOpen={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            <ErrorBoundary fallbackMessage="This page encountered an error.">
              <Routes>
                <Route
                  path="/"
                  element={
                    <DashboardPage
                      trades={store.filteredTrades}
                      stats={store.stats}
                      dailyStats={store.dailyStats}
                      equityCurve={store.equityCurve}
                      onAddTrade={() => setShowAddTrade(true)}
                      onImportCsv={() => setShowImportCsv(true)}
                    />
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <CalendarPage
                      trades={store.filteredTrades}
                      dailyStats={store.dailyStats}
                      onUpdate={store.updateTrade}
                      strategies={store.strategies}
                      journalEntries={store.journalEntries}
                      onSaveJournal={store.addJournalEntry}
                    />
                  }
                />
                <Route
                  path="/trades"
                  element={
                    <TradesPage
                      trades={store.filteredTrades}
                      filter={store.filter}
                      setFilter={store.setFilter}
                      onDelete={store.deleteTrade}
                      onUpdate={store.updateTrade}
                      instruments={store.instruments}
                      strategies={store.strategies}
                    />
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <AnalyticsPage
                      trades={store.filteredTrades}
                      stats={store.stats}
                      dailyStats={store.dailyStats}
                      equityCurve={store.equityCurve}
                    />
                  }
                />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Add Trade Modal */}
      <Modal
        open={showAddTrade}
        onClose={() => setShowAddTrade(false)}
        title="Add New Trade"
      >
        <AddTradeForm
          strategies={store.strategies}
          activePortfolioId={store.activePortfolioId}
          onSubmit={(data) => {
            store.addTrade(data);
            setShowAddTrade(false);
          }}
          onCancel={() => setShowAddTrade(false)}
        />
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        open={showImportCsv}
        onClose={() => setShowImportCsv(false)}
        title="Import Trades from CSV"
      >
        <CsvUpload
          onParseCsv={store.parseCsvText}
          onImport={store.bulkAddTrades}
          strategies={store.strategies}
          onClose={() => setShowImportCsv(false)}
        />
      </Modal>

      {/* Export Modal */}
      <Modal
        open={showExport}
        onClose={() => setShowExport(false)}
        title="Export Data"
        width="max-w-sm"
      >
        <div className="space-y-3">
          <button
            onClick={() => { exportTradesToCsv(store.filteredTrades); setShowExport(false); }}
            className="w-full flex items-center gap-3 bg-surface-2 hover:bg-surface-3 border border-border text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <span className="text-lg">📊</span>
            <div className="text-left">
              <div>Export Trades as CSV</div>
              <div className="text-xs text-gray-500">{store.filteredTrades.length} trades (current filters)</div>
            </div>
          </button>
          <button
            onClick={() => { exportFullBackup(store.trades, store.portfolios, store.journalEntries, store.activePortfolioId); setShowExport(false); }}
            className="w-full flex items-center gap-3 bg-surface-2 hover:bg-surface-3 border border-border text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <span className="text-lg">💾</span>
            <div className="text-left">
              <div>Full Backup (JSON)</div>
              <div className="text-xs text-gray-500">All portfolios, trades, journal entries</div>
            </div>
          </button>
        </div>
      </Modal>

      {/* Keyboard Shortcuts Modal */}
      <Modal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        title="Keyboard Shortcuts"
        width="max-w-xs"
      >
        <div className="space-y-2">
          {SHORTCUTS.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-400">{description}</span>
              <kbd className="px-2 py-0.5 bg-surface-2 border border-border rounded text-xs font-mono text-white">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </Modal>

      {/* Portfolio Settings Modal */}
      {store.activePortfolio && (
        <PortfolioSettingsModal
          open={showPortfolioSettings}
          onClose={() => setShowPortfolioSettings(false)}
          portfolio={store.activePortfolio}
          onUpdatePortfolio={store.updatePortfolio}
          onAddTransaction={store.addTransaction}
          onDeleteTransaction={store.deleteTransaction}
        />
      )}
    </>
  );
}
