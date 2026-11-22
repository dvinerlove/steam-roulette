import React from 'react';
import type { Settings } from '../types';
import { Tag, RefreshCcw } from 'lucide-react';
import { t } from '../i18n';

interface SettingsDataPanelProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  preloading: boolean;
  preloadProgress: number;
  handlePreloadPrices: () => Promise<void>;
}

const SettingsDataPanel: React.FC<SettingsDataPanelProps> = ({
  settings,
  setSettings,
  preloading,
  preloadProgress,
  handlePreloadPrices,
}) => {
  const loc = settings.locale;
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <Tag size={20} /> {t(loc, 'prices.section')}
        </h3>
        <div className="bg-slate-700/30 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{t(loc, 'prices.showPrices')}</span>
              <input type="checkbox" checked={settings.prices.showPrices} onChange={(e) => setSettings({ ...settings, prices: { ...settings.prices, showPrices: e.target.checked } })} className="w-5 h-5 accent-indigo-500" />
            </label>
            <label className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">{t(loc, 'prices.showDiscounts')}</span>
              <input type="checkbox" checked={settings.prices.showDiscounts} onChange={(e) => setSettings({ ...settings, prices: { ...settings.prices, showDiscounts: e.target.checked } })} className="w-5 h-5 accent-indigo-500" />
            </label>
          </div>

          <div className="space-y-2">
            <button onClick={handlePreloadPrices} disabled={preloading} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2">
              {preloading ? (
                <>
                  <RefreshCcw className="animate-spin" size={20} /> {t(loc, 'prices.loading', { n: preloadProgress })}
                </>
              ) : (
                <>
                  <RefreshCcw size={20} /> {t(loc, 'prices.loadAll')}
                </>
              )}
            </button>
            {preloading && <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-green-500 h-full" style={{ width: `${preloadProgress}%` }}></div></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDataPanel;
