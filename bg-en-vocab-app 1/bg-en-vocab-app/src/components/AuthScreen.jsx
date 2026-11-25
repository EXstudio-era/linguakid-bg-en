import React, { useState } from 'react';

export default function AuthScreen({ lang, setLang, defaultCode, defaultRole, onLogin, t }) {
  const [code, setCode] = useState(defaultCode || 'DEMO-FAMILY');
  const [role, setRole] = useState(defaultRole || 'child');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin((code || 'DEMO-FAMILY').trim().toUpperCase(), role);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-emerald-50/70 via-white to-sky-50/60">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
            {['ru', 'bg'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition ${
                  lang === l ? 'bg-emerald-500 text-white' : 'text-slate-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 card-shadow border border-slate-100 animate-pop">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-3xl shadow-md">
              🦉
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800">{t('loginTitle')}</h1>
            <p className="text-sm font-bold text-emerald-600 mt-1">{t('appSubtitle')}</p>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t('loginDesc')}</p>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              {t('familyCodeLabel')}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('familyCodePlaceholder')}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none font-extrabold text-slate-800 uppercase tracking-wide"
            />
            <p className="text-xs text-slate-400 mt-1.5">{t('demoHint')}</p>
          </div>

          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            {t('whoIsUsing')}
          </label>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('child')}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                role === 'child' ? 'border-emerald-500 bg-emerald-50/70' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-2xl mb-1.5">🧒</div>
              <div className="font-extrabold text-slate-800">{t('roleChild')}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-snug">{t('roleChildDesc')}</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('parent')}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                role === 'parent' ? 'border-indigo-500 bg-indigo-50/70' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-2xl mb-1.5">👩‍💻</div>
              <div className="font-extrabold text-slate-800">{t('roleParent')}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-snug">{t('roleParentDesc')}</div>
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg btn-3d"
            style={{ boxShadow: '0 5px 0 0 #059669' }}
          >
            {t('enterBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
