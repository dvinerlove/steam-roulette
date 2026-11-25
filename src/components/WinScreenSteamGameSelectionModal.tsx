import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Game } from '../types';
import type { SteamSearchResult } from '../utils/steam';
import { X } from 'lucide-react';
import { t, type Locale } from '../i18n';

interface WinScreenSteamGameSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  searchResults: SteamSearchResult[];
  onSelect: (appId: string | undefined, originalGame: Game) => void;
  locale: Locale;
}

const WinScreenSteamGameSelectionModal: React.FC<WinScreenSteamGameSelectionModalProps> = ({
  isOpen,
  onClose,
  game,
  searchResults,
  onSelect,
  locale,
}) => {
  return (
    <AnimatePresence>
      {isOpen && game && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        role="dialog" aria-modal="true" aria-label={t(locale, 'winSelect.title', { name: game.name })}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: 'easeOut' } }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{t(locale, 'winSelect.title', { name: game.name })}</h2>
          <button onClick={onClose} aria-label={t(locale, 'action.close')} className="p-2 -m-1 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <p className="text-slate-300 mb-4">
          {t(locale, 'winSelect.hint')}
        </p>

        <div className="space-y-3">
          {searchResults.map((result) => (
            <div
              key={result.appId}
              className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition"
              onClick={() => onSelect(result.appId, game)}
            >
              {result.icon && <img src={result.icon} alt={result.name} className="w-10 h-10 rounded-md" />}
              <span className="text-white font-medium">{result.name}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onSelect(undefined, game)} // User can choose to not select an appId
          className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition"
        >
          {t(locale, 'steamSelect.skip')}
        </button>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinScreenSteamGameSelectionModal;
