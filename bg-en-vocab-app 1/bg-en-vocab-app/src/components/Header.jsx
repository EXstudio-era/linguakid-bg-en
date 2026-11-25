import React from 'react';
import { Copy, Gamepad2, Settings, ShieldCheck } from 'lucide-react';

export default function Header({
  familyCode,
  lang,
  onToggleLang,
  role,
  onSwitchRole,
  onOpenSettings,
  cloudConnected,
  onCopyCode,
  t
}) {
  const isParent = role === 'parent';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
            BG
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-slate-800 leading-tight truncate flex items-center gap-2">
              <span>{t('appTitle')}</span>
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  cloudConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cloudConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {cloudConnected ? t('cloudConnected') : t('localMode')}
              </span>
            </div>
            <button
              onClick={onCopyCode}
              className="text-xs font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition"
            >
              <span>{familyCode}</span>
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-slate-700 transition"
          >
            {lang === 'ru' ? 'RU 🇷🇺' : 'BG 🇧🇬'}
          </button>
          <button
            onClick={onSwitchRole}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              isParent
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
          >
            {isParent ? <Gamepad2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{isParent ? t('switchToChild') : t('switchToParent')}</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            aria-label={t('settings')}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
