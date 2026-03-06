import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar, { MobileHeader } from './components/layout/Sidebar';
import Modal from './components/common/Modal';
import AddTradeForm from './components/trades/AddTradeForm';
import CsvUpload from './components/trades/CsvUpload';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import TradesPage from './pages/TradesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { useTradeStore } from './store/useTradeStore';

export default function App() {
  const store = useTradeStore();
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [showImportCsv, setShowImportCsv] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar
          onAddTrade={() => setShowAddTrade(true)}
          onImportCsv={() => setShowImportCsv(true)}
          portfolios={store.portfolios}
          activePortfolio={store.activePortfolio}
          onSwitchPortfolio={store.setActivePortfolioId}
          onAddPortfolio={store.addPortfolio}
          onDeletePortfolio={store.deletePortfolio}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileHeader onMenuOpen={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            <Routes>
              <Route
                path="/"
                element={
                  <DashboardPage
                    trades={store.filteredTrades}
                    stats={store.stats}
                    dailyStats={store.dailyStats}
                    equityCurve={store.equityCurve}
                  />
                }
              />
              <Route
                path="/calendar"
                element={
                  <CalendarPage
                    trades={store.filteredTrades}
                    dailyStats={store.dailyStats}
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
          onImport={store.importCsvTrades}
          onClose={() => setShowImportCsv(false)}
        />
      </Modal>
    </BrowserRouter>
  );
}
