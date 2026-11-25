import React from 'react';
import type { Locale } from '../i18n';
import { t } from '../i18n';
import { Image as ImageIcon, Trash2 } from 'lucide-react';

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
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
      />
    </div>
    <div className="space-y-2">
      <label className="text-slate-400 text-xs">Steam App ID</label>
      <input
        type="text"
        value={editForm.appId}
        onChange={(e) => setEditForm({ ...editForm, appId: e.target.value })}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
      />
    </div>
    <div className="space-y-2">
      <label className="text-slate-400 text-xs">{t(loc, 'games.color')}</label>
      <input
        type="color"
        value={editForm.color}
        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
        className="w-full h-10 rounded-lg border border-slate-600 p-1 bg-slate-700 cursor-pointer"
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
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden border flex items-center justify-center" style={{ borderColor: editForm.color, backgroundColor: `${editForm.color}33` }}>
          {editForm.image ? (
            <img src={editForm.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={20} className="text-slate-500" />
          )}
        </div>
        <label htmlFor="game-image-upload" className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-center text-slate-300 text-sm cursor-pointer hover:bg-slate-600 transition">
          {editForm.image ? t(loc, 'action.change') : t(loc, 'appearance.upload')}
        </label>
        {editForm.image && (
          <button type="button" onClick={() => setEditForm({ ...editForm, image: '' })} aria-label={t(loc, 'action.remove')} title={t(loc, 'action.remove')} className="p-2 min-w-[44px] min-h-[44px] rounded-lg text-red-400 hover:bg-red-600/20 transition flex items-center justify-center">
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
    <div className="flex gap-2 pt-1">
      <button type="button" onClick={onSave} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg text-base font-medium">
        {t(loc, 'action.save')}
      </button>
      <button type="button" onClick={onCancel} className="px-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg text-base font-medium">
        {t(loc, 'action.cancel')}
      </button>
    </div>
  </div>
);

export default EditGameForm;
