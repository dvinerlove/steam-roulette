import React from 'react';
import type { Locale } from '../i18n';
import { t } from '../i18n';

interface EditGameFormProps {
  loc: Locale;
  editForm: { name: string; appId: string; color: string; image: string };
  setEditForm: React.Dispatch<React.SetStateAction<{ name: string; appId: string; color: string; image: string }>>;
  onSave: () => void;
  onCancel: () => void;
}

const EditGameForm: React.FC<EditGameFormProps> = ({ loc, editForm, setEditForm, onSave, onCancel }) => (
  <div className="space-y-3">
    <div className="space-y-2">
      <label className="text-slate-400 text-xs">{t(loc, 'games.name')}</label>
      <input
        type="text"
        value={editForm.name}
        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
      />
    </div>
    <div className="space-y-2">
      <label className="text-slate-400 text-xs">Steam App ID</label>
      <input
        type="text"
        value={editForm.appId}
        onChange={(e) => setEditForm({ ...editForm, appId: e.target.value })}
        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
      />
    </div>
    <div className="space-y-2">
      <label className="text-slate-400 text-xs">{t(loc, 'games.color')}</label>
      <input
        type="color"
        value={editForm.color}
        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
        className="w-full h-10 rounded"
      />
    </div>
    <div className="space-y-2">
      <label className="text-slate-400 text-xs">{t(loc, 'edit.image')}</label>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="game-image-upload"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (file.size > 1024 * 1024) {
            alert(t(loc, 'err.imageTooLarge'));
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => setEditForm({ ...editForm, image: event.target?.result as string });
          reader.readAsDataURL(file);
        }}
      />
      <div className="flex gap-2">
        <label htmlFor="game-image-upload" className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-center text-slate-300 text-sm cursor-pointer hover:bg-slate-600 transition">
          {t(loc, 'appearance.upload')}
        </label>
        {editForm.image && (
          <button type="button" onClick={() => setEditForm({ ...editForm, image: '' })} className="px-3 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 text-sm">
            {t(loc, 'action.reset')}
          </button>
        )}
      </div>
    </div>
    <div className="flex gap-2 pt-1">
      <button type="button" onClick={onSave} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded text-base font-medium">
        {t(loc, 'action.save')}
      </button>
      <button type="button" onClick={onCancel} className="px-6 bg-slate-600 hover:bg-slate-500 text-white py-3 rounded text-base font-medium">
        {t(loc, 'action.cancel')}
      </button>
    </div>
  </div>
);

export default EditGameForm;
