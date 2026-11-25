import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Settings } from '../types';

import SettingsAppearancePanel from './SettingsAppearancePanel';
import SettingsIntegrationPanel from './SettingsIntegrationPanel';
import SettingsDataPanel from './SettingsDataPanel';
import { Settings as SettingsIcon, Palette, Gamepad2, Tag, X } from 'lucide-react';
import { t } from '../i18n';

interface SettingsPanelProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  clearAll: () => void;
  // Props for Integration Panel
  dbStatus: 'loading' | 'connected' | 'disconnected';
  dbError: string | null;
  // Props for Data Panel
  preloading: boolean;
  preloadProgress: number;
  handlePreloadPrices: () => Promise<void>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  setIsOpen,
  settings,
  setSettings,
  clearAll,
  dbStatus,
  dbError,
  preloading,
  preloadProgress,
  handlePreloadPrices,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'integration' | 'data'>('appearance');

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/40 z-50" onClick={() => setIsOpen(false)}>
      <motion.div
        role="dialog" aria-modal="true" aria-label={t(settings.locale, 'settings.title')}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 h-full w-full md:w-[600px] bg-slate-800 border-l border-slate-700 shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 sticky top-0 bg-slate-800 border-b border-slate-700 z-10 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon size={28} /> {t(settings.locale, 'settings.title')}
          </h2>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setIsOpen(false)} aria-label={t(settings.locale, 'action.close')} title={t(settings.locale, 'action.close')} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-700 flex gap-2">
          {[
            { id: 'appearance', icon: Palette, label: t(settings.locale, 'settings.appearance') },
            { id: 'integration', icon: Gamepad2, label: t(settings.locale, 'settings.integrations') },
            { id: 'data', icon: Tag, label: t(settings.locale, 'settings.data') },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg transition-all whitespace-nowrap text-sm ${
                activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'appearance' && (
            <SettingsAppearancePanel 
              settings={settings} 
              setSettings={setSettings} 
              clearAll={clearAll} 
            />
          )}
          {activeTab === 'integration' && (
            <SettingsIntegrationPanel 
              settings={settings} 
              setSettings={setSettings} 
              dbStatus={dbStatus} 
              dbError={dbError} 
            />
          )}
          {activeTab === 'data' && (
            <SettingsDataPanel
              settings={settings}
              setSettings={setSettings}
              preloading={preloading}
              preloadProgress={preloadProgress}
              handlePreloadPrices={handlePreloadPrices}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
