import React from 'react';
import type { SteamSearchResult } from '../utils/steam';
import { X } from 'lucide-react';
import { t, type Locale } from '../i18n';

interface SteamGameSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  searchResults: SteamSearchResult[];
  onSelect: (appId: string | undefined) => void;
  locale: Locale;
}

const SteamGameSelectionModal: React.FC<SteamGameSelectionModalProps> = ({
  isOpen,
  onClose,
  gameName,
  searchResults,
  onSelect,
  locale,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t(locale, 'steamSelect.title', { name: gameName })} className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-4">{t(locale, 'steamSelect.title', { name: gameName })}</h2>
        <p className="text-slate-300 mb-4">
          {t(locale, 'steamSelect.hint')}
        </p>

        <div className="space-y-3">
          {searchResults.map((result) => (
            <div
              key={result.appId}
              className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition"
              onClick={() => onSelect(result.appId)}
            >
              {result.icon && <img src={result.icon} alt={result.name} className="w-10 h-10 rounded-md" />}
              <span className="text-white font-medium">{result.name}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onSelect(undefined)} // User can choose to not select an appId
          className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition"
        >
          {t(locale, 'steamSelect.skip')}
        </button>
      </div>
    </div>
  );
};

export default SteamGameSelectionModal;
