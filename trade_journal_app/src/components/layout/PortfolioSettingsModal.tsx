import { useState } from 'react';
import { DollarSign, ArrowDownCircle, ArrowUpCircle, Trash2, Pencil, Check, X } from 'lucide-react';
import Modal from '../common/Modal';
import type { Portfolio, Transaction } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio;
  onUpdatePortfolio: (id: string, updates: Partial<Pick<Portfolio, 'initialBalance' | 'name' | 'color'>>) => void;
  onAddTransaction: (portfolioId: string, type: Transaction['type'], amount: number, note: string) => void;
  onDeleteTransaction: (portfolioId: string, transactionId: string) => void;
}

export default function PortfolioSettingsModal({
  open, onClose, portfolio, onUpdatePortfolio, onAddTransaction, onDeleteTransaction,
}: Props) {
  // Initial balance editing
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState((portfolio.initialBalance || 0).toString());

  // Transaction form
  const [txType, setTxType] = useState<Transaction['type']>('DEPOSIT');
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');

  const transactions = portfolio.transactions || [];
  const totalDeposits = transactions.filter(t => t.type === 'DEPOSIT').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'WITHDRAWAL').reduce((s, t) => s + t.amount, 0);
  const netCashFlow = totalDeposits - totalWithdrawals;

  const handleSaveBalance = () => {
    const val = parseFloat(balanceInput);
    if (!isNaN(val) && val >= 0) {
      onUpdatePortfolio(portfolio.id, { initialBalance: val });
      setEditingBalance(false);
    }
  };

  const handleAddTransaction = () => {
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) return;
    onAddTransaction(portfolio.id, txType, amt, txNote.trim());
    setTxAmount('');
    setTxNote('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Portfolio Settings" width="max-w-xl">
      <div className="space-y-6">

        {/* Initial Balance Section */}
        <div className="bg-surface-2 rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Initial Deposit
            </label>
            {!editingBalance && (
              <button
                onClick={() => { setBalanceInput((portfolio.initialBalance || 0).toString()); setEditingBalance(true); }}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors cursor-pointer"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>
          {editingBalance ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="relative flex-1">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  autoFocus
                  type="number"
                  min="0"
                  step="0.01"
                  value={balanceInput}
                  onChange={e => setBalanceInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveBalance()}
                  className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <button
                onClick={handleSaveBalance}
                className="p-2 bg-profit/20 text-profit rounded-lg hover:bg-profit/30 transition-colors cursor-pointer"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => setEditingBalance(false)}
                className="p-2 bg-surface border border-border text-gray-400 rounded-lg hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-2xl font-bold text-white">
              ${(portfolio.initialBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Cash Flow Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-2 rounded-xl p-3 border border-border text-center">
            <p className="text-xs text-gray-400 mb-1">Net Deposits</p>
            <p className="text-sm font-semibold text-profit">
              +${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-surface-2 rounded-xl p-3 border border-border text-center">
            <p className="text-xs text-gray-400 mb-1">Withdrawals</p>
            <p className="text-sm font-semibold text-loss">
              -${totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-surface-2 rounded-xl p-3 border border-border text-center">
            <p className="text-xs text-gray-400 mb-1">Net Cash Flow</p>
            <p className={`text-sm font-semibold ${netCashFlow >= 0 ? 'text-profit' : 'text-loss'}`}>
              {netCashFlow >= 0 ? '+' : '-'}${Math.abs(netCashFlow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Add Transaction */}
        <div className="bg-surface-2 rounded-xl p-4 border border-border">
          <h3 className="text-sm font-medium text-white mb-3">Log Deposit / Withdrawal</h3>
          <div className="space-y-3">
            {/* Type toggle */}
            <div className="flex rounded-lg bg-surface border border-border overflow-hidden">
              <button
                onClick={() => setTxType('DEPOSIT')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  txType === 'DEPOSIT'
                    ? 'bg-profit/15 text-profit border-r border-border'
                    : 'text-gray-400 hover:text-gray-200 border-r border-border'
                }`}
              >
                <ArrowDownCircle size={16} />
                Deposit
              </button>
              <button
                onClick={() => setTxType('WITHDRAWAL')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  txType === 'WITHDRAWAL'
                    ? 'bg-loss/15 text-loss'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <ArrowUpCircle size={16} />
                Withdrawal
              </button>
            </div>

            {/* Amount */}
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={txAmount}
                onChange={e => setTxAmount(e.target.value)}
                placeholder="Amount"
                className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Note */}
            <input
              value={txNote}
              onChange={e => setTxNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTransaction()}
              placeholder="Note (optional)"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
            />

            {/* Submit */}
            <button
              onClick={handleAddTransaction}
              disabled={!txAmount || parseFloat(txAmount) <= 0}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                txType === 'DEPOSIT'
                  ? 'bg-profit/20 text-profit hover:bg-profit/30 disabled:opacity-40 disabled:cursor-not-allowed'
                  : 'bg-loss/20 text-loss hover:bg-loss/30 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {txType === 'DEPOSIT' ? 'Add Deposit' : 'Record Withdrawal'}
            </button>
          </div>
        </div>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
              Transaction History
            </h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 bg-surface-2 rounded-lg px-3 py-2.5 border border-border group hover:border-gray-600 transition-colors"
                >
                  <div className={`p-1.5 rounded-lg ${tx.type === 'DEPOSIT' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'}`}>
                    {tx.type === 'DEPOSIT' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-semibold ${tx.type === 'DEPOSIT' ? 'text-profit' : 'text-loss'}`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      {tx.note && (
                        <span className="text-xs text-gray-500 truncate">{tx.note}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(parseISO(tx.date), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteTransaction(portfolio.id, tx.id)}
                    className="p-1.5 text-gray-600 hover:text-loss rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
