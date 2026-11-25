import React from 'react';
import { Award, BookOpen, Layers } from 'lucide-react';
import { getCompletedSubsectionsCount, TOPIC_COLORS } from '../lib/i18n';

export default function ChildDashboard({ topics, progress, onOpenTopic, t }) {
  const totalStars = Object.values(progress).reduce((s, p) => s + (p.stars || 0), 0);
  const completedCount = topics.filter((tp) => progress[tp.id]?.status === 'completed').length;
  const accValues = Object.values(progress)
    .filter((p) => p.bestAccuracy > 0)
    .map((p) => p.bestAccuracy);
  const avgAcc = accValues.length ? Math.round(accValues.reduce((a, b) => a + b, 0) / accValues.length) : 0;

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-12">
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 rounded-3xl p-5 sm:p-7 text-white mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">{t('childGreeting')}</h1>
            <p className="text-emerald-50 text-sm sm:text-base font-medium mt-1">{t('childSubgreeting')}</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            <div className="bg-white/20 rounded-2xl px-3.5 py-2.5 text-center">
              <div className="text-xl sm:text-2xl font-black">⭐ {totalStars}</div>
              <div className="text-[11px] font-bold text-white/90">{t('totalStars')}</div>
            </div>
            <div className="bg-white/20 rounded-2xl px-3.5 py-2.5 text-center">
              <div className="text-xl sm:text-2xl font-black">
                {completedCount}/{topics.length}
              </div>
              <div className="text-[11px] font-bold text-white/90">{t('completedTopics')}</div>
            </div>
            <div className="bg-white/20 rounded-2xl px-3.5 py-2.5 text-center">
              <div className="text-xl sm:text-2xl font-black">{avgAcc}%</div>
              <div className="text-[11px] font-bold text-white/90">{t('avgAccuracy')}</div>
            </div>
          </div>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center card-shadow border border-slate-100">
          <div className="text-5xl mb-3">📚</div>
          <p className="text-slate-600 font-bold">{t('noTopicsChild')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((tp) => {
            const c = TOPIC_COLORS[tp.color] || TOPIC_COLORS.emerald;
            const prog = progress[tp.id] || { status: 'not_started', stars: 0, bestAccuracy: 0, stages: {} };
            const doneSubs = getCompletedSubsectionsCount(prog);
            const canStart = tp.words.length >= 2;

            return (
              <div
                key={tp.id}
                className="bg-white rounded-3xl p-5 card-shadow border-2 border-slate-100 flex flex-col justify-between hover:border-slate-200 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-14 h-14 rounded-2xl ${c.soft} border ${c.border} flex items-center justify-center text-3xl`}>
                      {tp.emoji}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {prog.status === 'completed' ? (
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          ✓ {t('statusCompleted')}
                        </span>
                      ) : prog.status === 'in_progress' || doneSubs > 0 ? (
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                          ⏳ {t('subsectionsShort', doneSubs, 6)}
                        </span>
                      ) : (
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                          {t('statusNotStarted')}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((i) => (
                          <span key={i} className={`text-lg ${i <= (prog.stars || 0) ? 'opacity-100' : 'opacity-25 grayscale'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">{tp.title}</h2>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mb-3">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> {t('wordsCount', tp.words.length)}
                    </span>
                    {prog.bestAccuracy > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <Award className="w-3.5 h-3.5" /> {prog.bestAccuracy}%
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full ${c.bg} rounded-full transition-all`}
                      style={{ width: `${Math.round((doneSubs / 6) * 100)}%` }}
                    />
                  </div>
                </div>

                <button
                  disabled={!canStart}
                  onClick={() => onOpenTopic(tp.id)}
                  className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-white text-base btn-3d flex items-center justify-center gap-2 ${
                    canStart ? `${c.bg} hover:brightness-105` : 'bg-slate-300 cursor-not-allowed'
                  }`}
                  style={canStart ? { boxShadow: `0 4px 0 0 ${c.shadow}` } : undefined}
                >
                  <Layers className="w-5 h-5" />
                  <span>{canStart ? t('openTopic') : t('needWordsToStart')}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
