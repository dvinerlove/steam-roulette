import React from 'react';
import type { Settings } from '../types';
import { Database, Gamepad2 } from 'lucide-react';
import { t } from '../i18n';

interface SettingsIntegrationPanelProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  dbStatus: 'loading' | 'connected' | 'disconnected';
  dbError: string | null;
}

const SettingsIntegrationPanel: React.FC<SettingsIntegrationPanelProps> = ({
  settings,
  setSettings,
  dbStatus,
  dbError,
}) => {
  const loc = settings.locale;
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <Database size={20} /> {t(loc, 'db.section')}
        </h3>
        <div className="bg-slate-700/30 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Database size={20} className="text-slate-300" />
              <span className="text-slate-300">{t(loc, 'db.status')}</span>
            </div>
            <div className="flex items-center gap-2">
              {dbStatus === 'loading' && (
                <span className="text-yellow-400 text-sm">{t(loc, 'db.loading')}</span>
              )}
              {dbStatus === 'connected' && (
                <span className="text-green-400 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {t(loc, 'db.connected')}
                </span>
              )}
              {dbStatus === 'disconnected' && (
                <span className="text-red-400 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  {t(loc, 'db.disconnected')}
                </span>
              )}
            </div>
          </div>
          {dbError && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm break-all">
              {dbError}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <Gamepad2 size={20} /> Steam
        </h3>
        <div className="bg-slate-700/30 rounded-xl p-4 space-y-4">
          <label className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <span className="text-slate-300">{t(loc, 'steam.enable')}</span>
            <input type="checkbox" checked={settings.steam.enableIntegration} onChange={(e) => setSettings({ ...settings, steam: { ...settings.steam, enableIntegration: e.target.checked } })} className="w-5 h-5 accent-indigo-500" />
          </label>

          {settings.steam.enableIntegration && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-slate-300 text-sm">{t(loc, 'steam.region')}</label>
                <select value={settings.steam.region} onChange={(e) => setSettings({ ...settings, steam: { ...settings.steam, region: e.target.value } })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                  <option value="kz">🇰🇿 {t(loc, 'region.kz')}</option>
                  <option value="ru">🇷🇺 {t(loc, 'region.ru')}</option>
                  <option value="us">🇺🇸 {t(loc, 'region.us')}</option>
                  <option value="eu">🇪🇺 {t(loc, 'region.eu')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 text-sm">{t(loc, 'steam.currency')}</label>
                <select value={settings.steam.currency} onChange={(e) => setSettings({ ...settings, steam: { ...settings.steam, currency: e.target.value } })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                  <option value="KZT">KZT (₸)</option>
                  <option value="RUB">RUB (₽)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsIntegrationPanel;
