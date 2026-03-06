import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday,
  addMonths, subMonths, parseISO, getWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Trade, DailyStats } from '../../types';
import { formatCurrency, pnlColor } from '../../utils/calculations';

interface Props {
  trades: Trade[];
  dailyStats: DailyStats[];
  onDayClick: (date: string, trades: Trade[]) => void;
}

interface WeekSummary {
  weekNum: number;
  pnl: number;
  tradingDays: number;
  trades: number;
  wins: number;
  losses: number;
}

export default function TradingCalendar({ trades, dailyStats, onDayClick }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const statsMap = useMemo(() => {
    const m = new Map<string, DailyStats>();
    dailyStats.forEach(s => m.set(s.date, s));
    return m;
  }, [dailyStats]);

  const tradesMap = useMemo(() => {
    const m = new Map<string, Trade[]>();
    trades.forEach(t => {
      const d = t.exitDate
        ? format(parseISO(t.exitDate), 'yyyy-MM-dd')
        : format(parseISO(t.entryDate), 'yyyy-MM-dd');
      const arr = m.get(d) || [];
      arr.push(t);
      m.set(d, arr);
    });
    return m;
  }, [trades]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Weekly summaries
  const weekSummaries = useMemo(() => {
    const weeks: WeekSummary[] = [];
    const numWeeks = days.length / 7;

    for (let w = 0; w < numWeeks; w++) {
      const weekDays = days.slice(w * 7, (w + 1) * 7);
      let pnl = 0;
      let tradingDays = 0;
      let tradeCount = 0;
      let wins = 0;
      let losses = 0;

      weekDays.forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        const stat = statsMap.get(key);
        if (stat && isSameMonth(day, currentMonth)) {
          pnl += stat.pnl;
          tradingDays++;
          tradeCount += stat.trades;
          wins += stat.wins;
          losses += stat.losses;
        }
      });

      weeks.push({ weekNum: w + 1, pnl, tradingDays, trades: tradeCount, wins, losses });
    }
    return weeks;
  }, [days, statsMap, currentMonth]);

  const monthPnl = useMemo(() => {
    return dailyStats
      .filter(s => {
        const d = parseISO(s.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, s) => sum + s.pnl, 0);
  }, [dailyStats, monthStart, monthEnd]);

  const monthTrades = useMemo(() => {
    return dailyStats
      .filter(s => {
        const d = parseISO(s.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, s) => sum + s.trades, 0);
  }, [dailyStats, monthStart, monthEnd]);

  const greenDays = useMemo(() => {
    return dailyStats.filter(s => {
      const d = parseISO(s.date);
      return d >= monthStart && d <= monthEnd && s.pnl > 0;
    }).length;
  }, [dailyStats, monthStart, monthEnd]);

  const redDays = useMemo(() => {
    return dailyStats.filter(s => {
      const d = parseISO(s.date);
      return d >= monthStart && d <= monthEnd && s.pnl < 0;
    }).length;
  }, [dailyStats, monthStart, monthEnd]);

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm flex-wrap">
            <span className={pnlColor(monthPnl)}>
              {formatCurrency(monthPnl)} total
            </span>
            <span className="text-gray-500">{monthTrades} trades</span>
            <span className="text-profit">{greenDays} green</span>
            <span className="text-loss">{redDays} red</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-surface-2 text-gray-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-gray-600 py-2">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const stat = statsMap.get(key);
              const dayTrades = tradesMap.get(key) || [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              let bgClass = 'bg-surface';
              let borderClass = 'border-border';
              if (stat && stat.pnl > 0) {
                bgClass = 'bg-green-950/40';
                borderClass = 'border-green-900/50';
              } else if (stat && stat.pnl < 0) {
                bgClass = 'bg-red-950/40';
                borderClass = 'border-red-900/50';
              }

              return (
                <button
                  key={key}
                  onClick={() => dayTrades.length > 0 && onDayClick(key, dayTrades)}
                  className={`
                    relative min-h-16 sm:min-h-24 p-1 sm:p-2 rounded-md sm:rounded-lg border transition-all text-left
                    ${bgClass} ${borderClass}
                    ${!inMonth ? 'opacity-30' : ''}
                    ${isWeekend && !stat ? 'opacity-50' : ''}
                    ${dayTrades.length > 0 ? 'cursor-pointer hover:border-accent/50' : 'cursor-default'}
                    ${today ? 'ring-1 ring-accent/40' : ''}
                  `}
                >
                  <span className={`text-[10px] sm:text-xs font-medium ${today ? 'text-accent' : 'text-gray-500'}`}>
                    {format(day, 'd')}
                  </span>

                  {stat && (
                    <div className="mt-0.5 sm:mt-1">
                      <div className={`text-[10px] sm:text-sm font-bold ${stat.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {formatCurrency(stat.pnl)}
                      </div>
                      <div className="text-[8px] sm:text-[10px] text-gray-500 mt-0 sm:mt-0.5 hidden sm:block">
                        {stat.trades} trade{stat.trades !== 1 ? 's' : ''} · {stat.wins}W {stat.losses}L
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weekly summaries sidebar */}
        <div className="hidden md:flex flex-col gap-1 w-36 shrink-0">
          <div className="text-[10px] font-medium text-gray-600 py-2 text-center">Weekly</div>
          {weekSummaries.map(w => {
            let bgClass = 'bg-surface border-border';
            if (w.pnl > 0) bgClass = 'bg-green-950/30 border-green-900/40';
            else if (w.pnl < 0) bgClass = 'bg-red-950/30 border-red-900/40';

            return (
              <div
                key={w.weekNum}
                className={`flex-1 flex flex-col items-center justify-center rounded-lg border p-2 ${bgClass}`}
              >
                <span className="text-[10px] font-medium text-gray-500">Week {w.weekNum}</span>
                <span className={`text-sm font-bold mt-0.5 ${w.pnl === 0 ? 'text-gray-600' : pnlColor(w.pnl)}`}>
                  {w.pnl === 0 ? '$0' : formatCurrency(w.pnl)}
                </span>
                <span className="text-[9px] text-gray-600 mt-0.5">
                  {w.tradingDays} day{w.tradingDays !== 1 ? 's' : ''} · {w.trades} trade{w.trades !== 1 ? 's' : ''}
                </span>
                {w.trades > 0 && (
                  <span className="text-[9px] mt-0.5">
                    <span className="text-profit">{w.wins}W</span>
                    {' '}
                    <span className="text-loss">{w.losses}L</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
