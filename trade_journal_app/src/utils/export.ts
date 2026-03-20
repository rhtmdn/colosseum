import type { Trade, Portfolio, JournalEntry } from '../types';
import { formatPrice } from './calculations';

export function exportTradesToCsv(trades: Trade[]): void {
  const headers = [
    'Date', 'Exit Date', 'Instrument', 'Asset Class', 'Side', 'Entry Price', 'Exit Price',
    'Quantity', 'Stop Loss', 'Take Profit', 'P&L', 'Net P&L', 'Fees',
    'R Multiple', 'Status', 'Strategy', 'Setup', 'Rating', 'Tags', 'Notes'
  ];

  const rows = trades.map(t => [
    t.entryDate,
    t.exitDate ?? '',
    t.instrument,
    t.assetClass,
    t.side,
    formatPrice(t.entryPrice, t.instrument),
    t.exitPrice !== null ? formatPrice(t.exitPrice, t.instrument) : '',
    t.quantity.toString(),
    t.stopLoss !== null ? formatPrice(t.stopLoss, t.instrument) : '',
    t.takeProfit !== null ? formatPrice(t.takeProfit, t.instrument) : '',
    t.pnl.toFixed(2),
    t.netPnl.toFixed(2),
    t.fees.toFixed(2),
    t.rMultiple?.toFixed(2) ?? '',
    t.status,
    t.strategy,
    t.setup,
    t.rating.toString(),
    t.tags.join('; '),
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, 'trades-export.csv', 'text/csv');
}

export function exportFullBackup(
  trades: Trade[],
  portfolios: Portfolio[],
  journalEntries: JournalEntry[],
  activePortfolioId: string,
): void {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    trades,
    portfolios,
    journalEntries,
    activePortfolioId,
  };
  const json = JSON.stringify(backup, null, 2);
  downloadFile(json, 'colosseum-backup.json', 'application/json');
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
