import React from 'react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { getCompletedSubsectionsCount, SUBSECTIONS_META, TOPIC_COLORS } from '../lib/i18n';

export default function TopicHub({ topic, topicProgress, onBack, onStartSubsection, onStartFullLesson, t }) {
  const c = TOPIC_COLORS[topic.color] || TOPIC_COLORS.emerald;
  const stagesMap = topicProgress?.stages || {};
  const doneSubs = getCompletedSubsectionsCount(topicProgress);

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-12 animate-pop">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('backToTopics')}</span>
      </button>

      <div className="bg-white rounded-3xl p-5 sm:p-6 card-shadow border border-slate-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${c.soft} border ${c.border} flex items-center justify-center text-4xl shrink-0`}>
              {topic.emoji}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800">{topic.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                <span>{t('wordsCount', topic.words.length)}</span>
                <span className="text-emerald-600 font-extrabold">{t('subsectionsCompleted', doneSubs, 6)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onStartFullLesson}
            className={`py-3 px-5 rounded-2xl ${c.bg} hover:brightness-105 text-white font-extrabold text-sm btn-3d flex items-center justify-center gap-2 shrink-0`}
            style={{ boxShadow: `0 4px 0 0 ${c.shadow}` }}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t('fullLessonBtn')}</span>
          </button>
        </div>

        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-4">
          <div
            className={`h-full ${c.bg} rounded-full transition-all duration-500`}
            style={{ width: `${Math.round((doneSubs / 6) * 100)}%` }}
          />
        </div>
      </div>

      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-3 px-1">
        {t('chooseSubsection')}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SUBSECTIONS_META.map((sub) => {
          const sProg = stagesMap[sub.id];
          const isDone = Boolean(sProg?.completed);

          return (
            <div
              key={sub.id}
              className={`bg-white rounded-3xl p-5 card-shadow border-2 ${
                isDone ? 'border-emerald-200' : 'border-slate-100'
              } flex flex-col justify-between gap-4 transition hover:border-slate-200`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl ${sub.bg} border ${sub.border} flex items-center justify-center text-2xl shrink-0`}
                    >
                      {sub.icon}
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">#{sub.id}</div>
                      <h3 className="text-lg font-black text-slate-800 leading-tight">{t(sub.nameKey)}</h3>
                    </div>
                  </div>
                  {isDone && (
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                      ✓ {t('subsectionDone')}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">{t(sub.descKey)}</p>
                {isDone && sub.id > 1 && (
                  <div className="flex items-center gap-3 mt-3 text-xs font-extrabold">
                    <span className="text-amber-500">
                      {'⭐'.repeat(sProg.stars || 0)}
                      {'☆'.repeat(3 - (sProg.stars || 0))}
                    </span>
                    <span className="text-emerald-600">{sProg.bestAccuracy || 100}%</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onStartSubsection(sub.id)}
                className={`w-full py-3 px-4 rounded-2xl ${sub.btn} hover:brightness-105 text-white font-extrabold text-sm btn-3d flex items-center justify-center gap-2`}
                style={{ boxShadow: `0 4px 0 0 ${sub.shadow}` }}
              >
                {isDone ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isDone ? t('repeatAgainBtn') : t('startBtn')}</span>
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
