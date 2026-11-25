import React, { useState } from 'react';
import { Cloud, LogOut, X } from 'lucide-react';

export default function SettingsModal({
  lang,
  setLang,
  familyCode,
  parentPin,
  supabaseUrl,
  supabaseKey,
  onSave,
  onResetDemo,
  onLogout,
  onClose,
  t
}) {
  const [fc, setFc] = useState(familyCode);
  const [pin, setPin] = useState(parentPin);
  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState(supabaseKey);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      familyCode: (fc || familyCode).trim().toUpperCase(),
      parentPin: (pin || '1234').trim(),
      supabaseUrl: url.trim(),
      supabaseKey: key.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 animate-pop">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-800">{t('settingsTitle')}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('uiLanguage')}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLang('ru')}
              className={`py-2.5 rounded-xl font-bold border-2 transition ${
                lang === 'ru' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              🇷🇺 Русский (RU)
            </button>
            <button
              type="button"
              onClick={() => setLang('bg')}
              className={`py-2.5 rounded-xl font-bold border-2 transition ${
                lang === 'bg' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              🇧🇬 Български (BG)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {t('familyCodeSetting')}
            </label>
            <input
              type="text"
              value={fc}
              onChange={(e) => setFc(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border-2 border-slate-200 font-bold uppercase text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {t('parentPinSetting')}
            </label>
            <input
              type="text"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border-2 border-slate-200 font-bold text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 mb-1.5">
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span className="font-extrabold text-sm text-slate-800">{t('supabaseSection')}</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">{t('supabaseDesc')}</p>
          <label className="block text-xs font-bold text-slate-600 mb-1">{t('supabaseUrlLabel')}</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxxx.supabase.co"
            className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-xs font-mono mb-2.5 focus:border-emerald-500 focus:outline-none"
          />
          <label className="block text-xs font-bold text-slate-600 mb-1">{t('supabaseKeyLabel')}</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold btn-3d"
          style={{ boxShadow: '0 4px 0 0 #059669' }}
        >
          {t('saveAndSync')}
        </button>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button type="button" onClick={onResetDemo} className="text-xs font-bold text-slate-500 hover:text-rose-600">
            {t('resetDemo')}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> {t('logout')}
          </button>
        </div>
      </form>
    </div>
  );
}
