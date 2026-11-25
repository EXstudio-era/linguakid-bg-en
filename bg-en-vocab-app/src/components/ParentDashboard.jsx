import React, { useState } from 'react';
import { ArrowLeft, ListPlus, Pencil, Plus, RefreshCw, Trash2, Volume2, X } from 'lucide-react';
import { TOPIC_COLORS, TOPIC_EMOJIS } from '../lib/i18n';
import { parseBulkLines, speakEnglish } from '../lib/speech';

export default function ParentDashboard({
  topics,
  progress,
  onSaveTopic,
  onDeleteTopic,
  onAddWords,
  onUpdateWord,
  onDeleteWord,
  onRefreshSync,
  cloudConnected,
  t
}) {
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [topicModal, setTopicModal] = useState(null); // null | { mode: 'new' | 'edit', topic? }
  const [wordTab, setWordTab] = useState('single');
  const [newBg, setNewBg] = useState('');
  const [newEn, setNewEn] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [editingWord, setEditingWord] = useState(null);

  const selectedTopic = topics.find((tp) => tp.id === selectedTopicId);

  const completedCount = topics.filter((tp) => progress[tp.id]?.status === 'completed').length;
  const totalWords = topics.reduce((sum, tp) => sum + tp.words.length, 0);
  const accValues = Object.values(progress)
    .filter((p) => p.bestAccuracy > 0)
    .map((p) => p.bestAccuracy);
  const avgAcc = accValues.length ? Math.round(accValues.reduce((a, b) => a + b, 0) / accValues.length) : 0;

  const handleAddSingle = (e) => {
    e.preventDefault();
    if (!newBg.trim() || !newEn.trim() || !selectedTopic) return;
    onAddWords(selectedTopic.id, [{ bg: newBg.trim(), en: newEn.trim() }]);
    setNewBg('');
    setNewEn('');
  };

  const handleImportBulk = () => {
    const pairs = parseBulkLines(bulkText);
    if (!pairs.length || !selectedTopic) return;
    onAddWords(selectedTopic.id, pairs);
    setBulkText('');
  };

  if (selectedTopic) {
    const c = TOPIC_COLORS[selectedTopic.color] || TOPIC_COLORS.emerald;
    const bulkPairs = parseBulkLines(bulkText);

    return (
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-12">
        <button
          onClick={() => {
            setSelectedTopicId(null);
            setEditingWord(null);
          }}
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-500 hover:text-slate-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToTopics')}</span>
        </button>

        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${c.soft} border ${c.border} flex items-center justify-center text-2xl`}>
              {selectedTopic.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">{selectedTopic.title}</h1>
              <p className="text-xs font-bold text-slate-500">{t('wordsCount', selectedTopic.words.length)}</p>
            </div>
          </div>
          <button
            onClick={() => setTopicModal({ mode: 'edit', topic: selectedTopic })}
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" /> {t('edit')}
          </button>
        </div>

        <div className="bg-white rounded-3xl p-5 card-shadow border border-slate-100 mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setWordTab('single')}
              className={`px-4 py-2 rounded-xl text-sm font-extrabold transition ${
                wordTab === 'single' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('addWordSingle')}
            </button>
            <button
              onClick={() => setWordTab('bulk')}
              className={`px-4 py-2 rounded-xl text-sm font-extrabold transition ${
                wordTab === 'bulk' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('addWordsBulk')}
            </button>
          </div>

          {wordTab === 'single' ? (
            <form onSubmit={handleAddSingle} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <input
                type="text"
                required
                value={newBg}
                onChange={(e) => setNewBg(e.target.value)}
                placeholder={t('bgWordPlaceholder')}
                className="sm:col-span-5 py-3 px-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none font-semibold"
              />
              <input
                type="text"
                required
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                placeholder={t('enWordPlaceholder')}
                className="sm:col-span-5 py-3 px-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none font-semibold"
              />
              <button
                type="submit"
                className="sm:col-span-2 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold btn-3d"
                style={{ boxShadow: '0 4px 0 0 #059669' }}
              >
                {t('addBtn')}
              </button>
            </form>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">{t('bulkLabel')}</label>
              <textarea
                rows={5}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={t('bulkPlaceholder')}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none font-mono text-sm mb-3"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-extrabold text-indigo-600">{t('bulkDetected', bulkPairs.length)}</span>
                <button
                  onClick={handleImportBulk}
                  disabled={bulkPairs.length === 0}
                  className="py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-sm btn-3d"
                  style={{ boxShadow: '0 4px 0 0 #059669' }}
                >
                  {t('bulkImportBtn')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 card-shadow border border-slate-100">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-3">{t('wordsInTopic')}</h2>
          {selectedTopic.words.length === 0 ? (
            <p className="text-center text-slate-400 font-semibold py-8">{t('noWordsYet')}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {selectedTopic.words.map((w, idx) =>
                editingWord?.id === w.id ? (
                  <div key={w.id} className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={editingWord.bg}
                      onChange={(e) => setEditingWord({ ...editingWord, bg: e.target.value })}
                      className="flex-1 py-2 px-3 rounded-xl border-2 border-indigo-300 font-semibold text-sm"
                    />
                    <input
                      type="text"
                      value={editingWord.en}
                      onChange={(e) => setEditingWord({ ...editingWord, en: e.target.value })}
                      className="flex-1 py-2 px-3 rounded-xl border-2 border-indigo-300 font-semibold text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (editingWord.bg.trim() && editingWord.en.trim()) {
                            onUpdateWord(selectedTopic.id, {
                              id: w.id,
                              bg: editingWord.bg.trim(),
                              en: editingWord.en.trim()
                            });
                            setEditingWord(null);
                          }
                        }}
                        className="py-2 px-3.5 rounded-xl bg-emerald-500 text-white font-bold text-xs"
                      >
                        {t('save')}
                      </button>
                      <button
                        onClick={() => setEditingWord(null)}
                        className="py-2 px-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={w.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-extrabold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-800">{w.bg}</span>
                        <span className="text-slate-300 mx-2">—</span>
                        <span className="font-bold text-emerald-700">{w.en}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => speakEnglish(w.en)}
                        className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingWord({ ...w })}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteWord(selectedTopic.id, w.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {topicModal && (
          <TopicEditorModal
            initial={topicModal.topic}
            onClose={() => setTopicModal(null)}
            onSave={(data) => {
              onSaveTopic(data);
              setTopicModal(null);
            }}
            t={t}
          />
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800">{t('parentTitle')}</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">{t('parentSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {cloudConnected && (
            <button
              onClick={onRefreshSync}
              className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">{t('syncNow')}</span>
            </button>
          )}
          <button
            onClick={() => setTopicModal({ mode: 'new', topic: null })}
            className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm btn-3d flex items-center gap-2"
            style={{ boxShadow: '0 4px 0 0 #4338CA' }}
          >
            <Plus className="w-5 h-5" />
            <span>{t('newTopicBtn')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 card-shadow border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase">{t('completedTopics')}</div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {completedCount} / {topics.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 card-shadow border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase">{t('avgAccuracy')}</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{avgAcc}%</div>
        </div>
        <div className="bg-white rounded-2xl p-4 card-shadow border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase">{t('manageWords')}</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{totalWords}</div>
        </div>
      </div>

      <div className="space-y-3">
        {topics.map((tp) => {
          const c = TOPIC_COLORS[tp.color] || TOPIC_COLORS.emerald;
          const prog = progress[tp.id] || { status: 'not_started', bestAccuracy: 0, stars: 0, mistakeWords: [] };

          return (
            <div
              key={tp.id}
              className="bg-white rounded-3xl p-4 sm:p-5 card-shadow border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                <div className={`w-14 h-14 rounded-2xl ${c.soft} border ${c.border} flex items-center justify-center text-3xl shrink-0`}>
                  {tp.emoji}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-slate-800 truncate">{tp.title}</h2>
                    {prog.status === 'completed' ? (
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        ✓ {t('statusCompleted')}
                      </span>
                    ) : prog.status === 'in_progress' ? (
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        ⏳ {t('statusInProgress')}
                      </span>
                    ) : (
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {t('statusNotStarted')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-500 mt-1">
                    <span>{t('wordsCount', tp.words.length)}</span>
                    <span>
                      {t('bestResult')}: <strong className="text-emerald-600">{prog.bestAccuracy || 0}%</strong>
                    </span>
                    <span>⭐ {prog.stars || 0}/3</span>
                  </div>
                  {prog.mistakeWords?.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-rose-500">{t('lastMistakes')}:</span>
                      {prog.mistakeWords.slice(0, 5).map((m, i) => (
                        <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700">
                          {m.bg} — {m.en}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedTopicId(tp.id)}
                  className="flex-1 md:flex-none py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center gap-1.5"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>
                    {t('manageWords')} ({tp.words.length})
                  </span>
                </button>
                <button
                  onClick={() => setTopicModal({ mode: 'edit', topic: tp })}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteTopic(tp.id)}
                  className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {topicModal && (
        <TopicEditorModal
          initial={topicModal.topic}
          onClose={() => setTopicModal(null)}
          onSave={(data) => {
            const savedId = onSaveTopic(data);
            setTopicModal(null);
            if (!data.id && savedId) setSelectedTopicId(savedId);
          }}
          t={t}
        />
      )}
    </main>
  );
}

function TopicEditorModal({ initial, onClose, onSave, t }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [emoji, setEmoji] = useState(initial?.emoji || '🦁');
  const [color, setColor] = useState(initial?.color || 'emerald');

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ id: initial?.id, title: title.trim(), emoji, color });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 animate-pop">
      <form onSubmit={submit} className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-extrabold text-slate-800">{initial ? t('edit') : t('newTopicBtn')}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-sm font-bold text-slate-700 mb-1.5">{t('topicNameLabel')}</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('topicNamePlaceholder')}
          className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none font-semibold mb-4"
        />

        <label className="block text-sm font-bold text-slate-700 mb-2">{t('chooseEmoji')}</label>
        <div className="grid grid-cols-6 gap-2 mb-4">
          {TOPIC_EMOJIS.map((em) => (
            <button
              type="button"
              key={em}
              onClick={() => setEmoji(em)}
              className={`text-2xl py-2 rounded-xl border-2 transition ${
                em === emoji ? 'border-emerald-500 bg-emerald-50 scale-105' : 'border-slate-100 hover:bg-slate-50'
              }`}
            >
              {em}
            </button>
          ))}
        </div>

        <label className="block text-sm font-bold text-slate-700 mb-2">{t('chooseColor')}</label>
        <div className="flex gap-2.5 mb-6">
          {Object.keys(TOPIC_COLORS).map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`w-9 h-9 rounded-full ${TOPIC_COLORS[c].bg} transition ${
                c === color ? `ring-4 ring-offset-2 ${TOPIC_COLORS[c].ring}` : 'opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-extrabold text-white btn-3d"
            style={{ boxShadow: '0 4px 0 0 #059669' }}
          >
            {t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
