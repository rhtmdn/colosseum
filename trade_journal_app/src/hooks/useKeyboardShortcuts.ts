import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Actions {
  onAddTrade: () => void;
  onImportCsv: () => void;
  onExport: () => void;
  onToggleHelp: () => void;
}

export function useKeyboardShortcuts(actions: Actions) {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      // Skip when typing in inputs
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;

      switch (e.key) {
        case 'n':
          e.preventDefault();
          actions.onAddTrade();
          break;
        case 'i':
          e.preventDefault();
          actions.onImportCsv();
          break;
        case 'e':
          e.preventDefault();
          actions.onExport();
          break;
        case '1':
          e.preventDefault();
          navigate('/');
          break;
        case '2':
          e.preventDefault();
          navigate('/calendar');
          break;
        case '3':
          e.preventDefault();
          navigate('/trades');
          break;
        case '4':
          e.preventDefault();
          navigate('/analytics');
          break;
        case '?':
          e.preventDefault();
          actions.onToggleHelp();
          break;
        case 'Escape':
          // Modals handle their own close via onClose props
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, actions]);
}

export const SHORTCUTS = [
  { key: 'N', description: 'New trade' },
  { key: 'I', description: 'Import CSV' },
  { key: 'E', description: 'Export data' },
  { key: '1', description: 'Dashboard' },
  { key: '2', description: 'Calendar' },
  { key: '3', description: 'Trade Log' },
  { key: '4', description: 'Analytics' },
  { key: '?', description: 'Show shortcuts' },
  { key: 'Esc', description: 'Close modal' },
];
