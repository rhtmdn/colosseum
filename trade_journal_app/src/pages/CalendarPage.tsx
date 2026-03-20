import { useState } from 'react';
import TradingCalendar from '../components/calendar/TradingCalendar';
import DayDetail from '../components/calendar/DayDetail';
import TradeDetail from '../components/trades/TradeDetail';
import Modal from '../components/common/Modal';
import type { Trade, DailyStats, JournalEntry } from '../types';

interface Props {
  trades: Trade[];
  dailyStats: DailyStats[];
  onUpdate: (id: string, updates: Partial<Trade>) => void;
  strategies: string[];
  journalEntries: JournalEntry[];
  onSaveJournal: (entry: JournalEntry) => void;
}

export default function CalendarPage({ trades, dailyStats, onUpdate, strategies, journalEntries, onSaveJournal }: Props) {
  const [selectedDay, setSelectedDay] = useState<{ date: string; trades: Trade[] } | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const getJournalEntry = (date: string) => journalEntries.find(e => e.date === date);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Click any day to view trades and journal</p>
      </div>

      <TradingCalendar
        trades={trades}
        dailyStats={dailyStats}
        onDayClick={(date, dayTrades) => setSelectedDay({ date, trades: dayTrades })}
      />

      <Modal
        open={!!selectedDay && !selectedTrade}
        onClose={() => setSelectedDay(null)}
        title="Day Summary"
        width="max-w-xl"
      >
        {selectedDay && (
          <DayDetail
            date={selectedDay.date}
            trades={selectedDay.trades}
            onTradeClick={setSelectedTrade}
            journalEntry={getJournalEntry(selectedDay.date)}
            onSaveJournal={onSaveJournal}
          />
        )}
      </Modal>

      <Modal
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
        title="Trade Detail"
        width="max-w-lg"
      >
        {selectedTrade && (
          <TradeDetail
            trade={selectedTrade}
            onUpdate={(id, updates) => {
              onUpdate(id, updates);
              setSelectedTrade(prev => prev ? { ...prev, ...updates } : null);
            }}
            strategies={strategies}
          />
        )}
      </Modal>
    </div>
  );
}
