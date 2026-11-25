import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import ChildDashboard from './components/ChildDashboard';
import Header from './components/Header';
import LessonRunner from './components/LessonRunner';
import ParentDashboard from './components/ParentDashboard';
import SettingsModal from './components/SettingsModal';
import { createDemoTopics } from './data/demoData';
import { I18N } from './lib/i18n';
import {
  fetchFamilyData,
  getSupabaseClient,
  removeTopic,
  removeWord,
  upsertProgress,
  upsertTopic,
  upsertWord
} from './lib/supabase';

const STORAGE_KEY = 'linguakid_react_v1';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function makeUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function App() {
  const initial = useMemo(() => loadSaved(), []);

  const [lang, setLang] = useState(initial?.lang || 'ru');
  const [familyCode, setFamilyCode] = useState(initial?.familyCode || '');
  const [role, setRole] = useState(initial?.role || 'child');
  const [parentPin, setParentPin] = useState(initial?.parentPin || '1234');
  const [supabaseUrl, setSupabaseUrl] = useState(initial?.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(initial?.supabaseKey || '');
  const [topics, setTopics] = useState(() => (initial?.topics?.length ? initial.topics : createDemoTopics()));
  const [progress, setProgress] = useState(() => initial?.progress || {});

  const [activeLessonTopicId, setActiveLessonTopicId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [toast, setToast] = useState('');

  const t = useCallback(
    (key, ...args) => {
      const entry = I18N[lang]?.[key];
      return typeof entry === 'function' ? entry(...args) : entry || key;
    },
    [lang]
  );

  const client = useMemo(() => getSupabaseClient(supabaseUrl, supabaseKey), [supabaseUrl, supabaseKey]);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  // Persist local snapshot
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ lang, familyCode, role, parentPin, supabaseUrl, supabaseKey, topics, progress })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [lang, familyCode, role, parentPin, supabaseUrl, supabaseKey, topics, progress]);

  // Sync & Realtime subscription when Supabase is configured
  const syncNow = useCallback(async () => {
    if (!client || !familyCode) {
      setCloudSynced(false);
      return;
    }
    try {
      const remote = await fetchFamilyData(client, familyCode);
      if (remote.topics.length > 0) {
        setTopics(remote.topics);
        setProgress(remote.progress);
      }
      setCloudSynced(true);
    } catch {
      setCloudSynced(false);
    }
  }, [client, familyCode]);

  useEffect(() => {
    if (!client || !familyCode) return undefined;
    syncNow();

    const fc = familyCode.toUpperCase();
    const channel = client
      .channel(`family-${fc}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics', filter: `family_code=eq.${fc}` }, syncNow)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'words', filter: `family_code=eq.${fc}` }, syncNow)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progress', filter: `family_code=eq.${fc}` }, syncNow)
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [client, familyCode, syncNow]);

  // Handlers
  const handleSaveTopic = (data) => {
    if (data.id) {
      setTopics((prev) => prev.map((tp) => (tp.id === data.id ? { ...tp, ...data } : tp)));
      upsertTopic(client, familyCode, data);
      return data.id;
    }
    const created = { id: makeUuid(), title: data.title, emoji: data.emoji, color: data.color, words: [] };
    setTopics((prev) => [...prev, created]);
    upsertTopic(client, familyCode, created);
    return created.id;
  };

  const handleDeleteTopic = (topicId) => {
    setTopics((prev) => prev.filter((tp) => tp.id !== topicId));
    setProgress((prev) => {
      const next = { ...prev };
      delete next[topicId];
      return next;
    });
    removeTopic(client, topicId);
  };

  const handleAddWords = (topicId, pairs) => {
    const created = pairs.map((p) => ({ id: makeUuid(), bg: p.bg, en: p.en }));
    setTopics((prev) =>
      prev.map((tp) => (tp.id === topicId ? { ...tp, words: [...tp.words, ...created] } : tp))
    );
    created.forEach((w) => upsertWord(client, familyCode, topicId, w));
  };

  const handleUpdateWord = (topicId, updatedWord) => {
    setTopics((prev) =>
      prev.map((tp) =>
        tp.id === topicId
          ? { ...tp, words: tp.words.map((w) => (w.id === updatedWord.id ? updatedWord : w)) }
          : tp
      )
    );
    upsertWord(client, familyCode, topicId, updatedWord);
  };

  const handleDeleteWord = (topicId, wordId) => {
    setTopics((prev) =>
      prev.map((tp) => (tp.id === topicId ? { ...tp, words: tp.words.filter((w) => w.id !== wordId) } : tp))
    );
    removeWord(client, wordId);
  };

  const handleStartLesson = (topicId) => {
    const prev = progress[topicId] || {};
    const nextProg = {
      status: prev.status === 'completed' ? 'completed' : 'in_progress',
      currentStage: 1,
      bestAccuracy: prev.bestAccuracy || 0,
      lastAccuracy: prev.lastAccuracy || 0,
      stars: prev.stars || 0,
      points: prev.points || 0,
      mistakeWords: prev.mistakeWords || []
    };
    setProgress((p) => ({ ...p, [topicId]: nextProg }));
    upsertProgress(client, familyCode, topicId, nextProg);
    setActiveLessonTopicId(topicId);
  };

  const handleLessonComplete = (topicId, summary) => {
    const prev = progress[topicId] || {};
    const nextProg = {
      status: 'completed',
      currentStage: 7,
      bestAccuracy: Math.max(prev.bestAccuracy || 0, summary.accuracy),
      lastAccuracy: summary.accuracy,
      stars: Math.max(prev.stars || 0, summary.stars),
      points: (prev.points || 0) + summary.points,
      mistakeWords: summary.mistakeList.map((w) => ({ bg: w.bg, en: w.en }))
    };
    setProgress((p) => ({ ...p, [topicId]: nextProg }));
    upsertProgress(client, familyCode, topicId, nextProg);
  };

  if (!familyCode) {
    return (
      <AuthScreen
        lang={lang}
        setLang={setLang}
        defaultCode="DEMO-FAMILY"
        defaultRole={role}
        onLogin={(code, chosenRole) => {
          setFamilyCode(code);
          setRole(chosenRole);
        }}
        t={t}
      />
    );
  }

  const activeTopic = topics.find((tp) => tp.id === activeLessonTopicId);
  if (activeTopic) {
    return (
      <LessonRunner
        topic={activeTopic}
        allTopics={topics}
        onComplete={(summary) => handleLessonComplete(activeTopic.id, summary)}
        onExit={() => setActiveLessonTopicId(null)}
        t={t}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        familyCode={familyCode}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'ru' ? 'bg' : 'ru'))}
        role={role}
        onSwitchRole={() => {
          if (role === 'parent') {
            setRole('child');
          } else {
            setPinInput('');
            setPinError(false);
            setShowPinModal(true);
          }
        }}
        onOpenSettings={() => setShowSettings(true)}
        cloudConnected={cloudSynced}
        onCopyCode={() => {
          navigator.clipboard?.writeText(familyCode).catch(() => {});
          triggerToast(t('toastCopied'));
        }}
        t={t}
      />

      {role === 'parent' ? (
        <ParentDashboard
          topics={topics}
          progress={progress}
          onSaveTopic={handleSaveTopic}
          onDeleteTopic={handleDeleteTopic}
          onAddWords={handleAddWords}
          onUpdateWord={handleUpdateWord}
          onDeleteWord={handleDeleteWord}
          onRefreshSync={syncNow}
          cloudConnected={cloudSynced}
          t={t}
        />
      ) : (
        <ChildDashboard topics={topics} progress={progress} onStartLesson={handleStartLesson} t={t} />
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 animate-pop">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pinInput.trim() === parentPin) {
                setRole('parent');
                setShowPinModal(false);
              } else {
                setPinError(true);
              }
            }}
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-extrabold text-slate-800">{t('pinModalTitle')}</h3>
              <button type="button" onClick={() => setShowPinModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{t('pinModalDesc')}</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder={t('pinPlaceholder')}
              className={`w-full text-center text-2xl tracking-widest font-bold py-3.5 px-4 rounded-2xl border-2 focus:outline-none mb-2 ${
                pinError ? 'border-rose-400 animate-shake' : 'border-slate-200 focus:border-indigo-500'
              }`}
            />
            {pinError && <p className="text-rose-600 text-sm font-semibold text-center mb-2">{t('pinWrong')}</p>}
            <button
              type="submit"
              className="w-full mt-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold btn-3d"
              style={{ boxShadow: '0 4px 0 0 #4338CA' }}
            >
              {t('enterBtn')}
            </button>
          </form>
        </div>
      )}

      {showSettings && (
        <SettingsModal
          lang={lang}
          setLang={setLang}
          familyCode={familyCode}
          parentPin={parentPin}
          supabaseUrl={supabaseUrl}
          supabaseKey={supabaseKey}
          onSave={({ familyCode: fc, parentPin: p, supabaseUrl: u, supabaseKey: k }) => {
            setFamilyCode(fc);
            setParentPin(p);
            setSupabaseUrl(u);
            setSupabaseKey(k);
            setShowSettings(false);
          }}
          onResetDemo={() => {
            setTopics(createDemoTopics());
            setProgress({});
            setShowSettings(false);
          }}
          onLogout={() => {
            setFamilyCode('');
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
          t={t}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-sm font-bold shadow-lg animate-pop">
          {toast}
        </div>
      )}
    </div>
  );
}
