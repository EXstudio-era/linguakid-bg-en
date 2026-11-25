import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Repeat, Sparkles, Volume2, X } from 'lucide-react';
import { FALLBACK_DISTRACTORS } from '../data/demoData';
import { normalizeAnswer, shuffle, speakEnglish } from '../lib/speech';

function buildQuizOptions(correctWord, topicWords, allTopics, mode) {
  const field = mode === 'bg-to-en' ? 'en' : 'bg';
  const used = new Set([normalizeAnswer(correctWord[field])]);
  const distractors = [];

  const sameTopic = shuffle(topicWords.filter((w) => w.id !== correctWord.id));
  const otherTopics = shuffle(
    allTopics
      .flatMap((tp) => tp.words)
      .filter((w) => w.id !== correctWord.id && !topicWords.some((tw) => tw.id === w.id))
  );
  const pool = [...sameTopic, ...otherTopics, ...shuffle(FALLBACK_DISTRACTORS)];

  for (const cand of pool) {
    if (distractors.length >= 3) break;
    const norm = normalizeAnswer(cand[field]);
    if (!used.has(norm)) {
      used.add(norm);
      distractors.push(cand);
    }
  }
  return shuffle([correctWord, ...distractors]);
}

function buildMatchBatches(words) {
  const shuffled = shuffle(words);
  const batches = [];
  for (let i = 0; i < shuffled.length; i += 5) {
    const slice = shuffled.slice(i, i + 5);
    batches.push({ left: shuffle(slice), right: shuffle(slice) });
  }
  return batches;
}

export default function LessonRunner({ topic, allTopics, onComplete, onExit, t }) {
  const [stage, setStage] = useState(1);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [mistakeIds, setMistakeIds] = useState(() => new Set());
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Stage 1: Flashcards (2 passes)
  const [s1Pass, setS1Pass] = useState(1);
  const [s1Index, setS1Index] = useState(0);

  // Stage 2 & 3: Quiz
  const [s2Queue] = useState(() => shuffle(topic.words));
  const [s2Index, setS2Index] = useState(0);
  const [s2Answered, setS2Answered] = useState(null);

  const [s3Queue] = useState(() => shuffle(topic.words));
  const [s3Index, setS3Index] = useState(0);
  const [s3Answered, setS3Answered] = useState(null);

  // Stage 4: Match pairs
  const [s4Batches] = useState(() => buildMatchBatches(topic.words));
  const [s4BatchIdx, setS4BatchIdx] = useState(0);
  const [s4Matched, setS4Matched] = useState([]);
  const [s4SelLeft, setS4SelLeft] = useState(null);
  const [s4SelRight, setS4SelRight] = useState(null);
  const [s4Error, setS4Error] = useState(null);

  // Stage 5: Typing EN -> BG
  const [s5Queue] = useState(() => shuffle(topic.words));
  const [s5Index, setS5Index] = useState(0);
  const [s5Input, setS5Input] = useState('');
  const [s5Feedback, setS5Feedback] = useState(null);

  // Stage 6: Typing BG -> EN (repeats wrong words at end of stage)
  const [s6Queue, setS6Queue] = useState(() => shuffle(topic.words).map((w) => ({ word: w, isRepeat: false })));
  const [s6Index, setS6Index] = useState(0);
  const [s6Input, setS6Input] = useState('');
  const [s6Feedback, setS6Feedback] = useState(null);

  const s2Options = useMemo(
    () => buildQuizOptions(s2Queue[s2Index], topic.words, allTopics, 'bg-to-en'),
    [s2Queue, s2Index, topic.words, allTopics]
  );

  const s3Options = useMemo(
    () => buildQuizOptions(s3Queue[s3Index], topic.words, allTopics, 'en-to-bg'),
    [s3Queue, s3Index, topic.words, allTopics]
  );

  const stageNames = [
    '',
    t('stage1Name'),
    t('stage2Name'),
    t('stage3Name'),
    t('stage4Name'),
    t('stage5Name'),
    t('stage6Name'),
    t('stage7Name')
  ];

  const recordMistake = (wordId) => {
    setMistakeIds((prev) => {
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });
  };

  useEffect(() => {
    if (stage === 7) {
      const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;
      const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
      const points = Math.max(20, correctAttempts * 10 + stars * 15);
      const mistakeList = topic.words.filter((w) => mistakeIds.has(w.id));
      onComplete({ accuracy, stars, points, mistakeList });
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }
  }, [stage]);

  // Stage 4 pair checking
  const evaluateMatch = (leftId, rightId) => {
    if (!leftId || !rightId) return;
    setTotalAttempts((n) => n + 1);
    if (leftId === rightId) {
      setCorrectAttempts((n) => n + 1);
      const w = topic.words.find((x) => x.id === leftId);
      if (w) speakEnglish(w.en);
      const nextMatched = [...s4Matched, leftId];
      setS4Matched(nextMatched);
      setS4SelLeft(null);
      setS4SelRight(null);

      if (nextMatched.length === s4Batches[s4BatchIdx].left.length) {
        setTimeout(() => {
          if (s4BatchIdx < s4Batches.length - 1) {
            setS4BatchIdx((i) => i + 1);
            setS4Matched([]);
          } else {
            setStage(5);
          }
        }, 420);
      }
    } else {
      recordMistake(leftId);
      if (navigator.vibrate) navigator.vibrate(70);
      setS4Error({ left: leftId, right: rightId });
      setTimeout(() => {
        setS4Error(null);
        setS4SelLeft(null);
        setS4SelRight(null);
      }, 460);
    }
  };

  const overallPct = Math.round(((stage - 1) / 6) * 100);
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;
  const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
  const points = Math.max(20, correctAttempts * 10 + stars * 15);
  const mistakeList = topic.words.filter((w) => mistakeIds.has(w.id));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => (stage === 7 ? onExit() : setShowExitConfirm(true))}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, overallPct)}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
              {stage}/7
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>
              {topic.emoji} {topic.title}
            </span>
            <span className="text-slate-700 font-extrabold">
              {t('stageOf', stage, 7)}: {stageNames[stage]}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 flex flex-col justify-center">
        {/* STAGE 1: FLASHCARDS (2 PASSES) */}
        {stage === 1 && (
          <div className="animate-pop">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-extrabold">
                <Repeat className="w-3.5 h-3.5" /> {t('passIndicator', s1Pass)}
              </span>
              <span className="text-xs font-extrabold text-slate-400">
                {t('cardOf', s1Index + 1, topic.words.length)}
              </span>
            </div>

            <div className="bg-white rounded-3xl p-8 sm:p-10 card-shadow border-2 border-slate-100 text-center mb-6">
              <div className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                🇧🇬 {t('leftColBg')}
              </div>
              <div className="text-4xl sm:text-5xl font-black text-slate-800 mb-6 break-words">
                {topic.words[s1Index].bg}
              </div>
              <div className="w-16 h-1 bg-slate-100 rounded-full mx-auto mb-6" />
              <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-500 mb-2">
                🇬🇧 {t('rightColEn')}
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 mb-6 break-words">
                {topic.words[s1Index].en}
              </div>
              <button
                onClick={() => speakEnglish(topic.words[s1Index].en)}
                className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-700 font-extrabold text-base transition active:scale-95"
              >
                <Volume2 className="w-5 h-5" />
                <span>{t('listenWord')}</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (s1Index < topic.words.length - 1) setS1Index((i) => i + 1);
                else if (s1Pass === 1) {
                  setS1Pass(2);
                  setS1Index(0);
                } else {
                  setStage(2);
                }
              }}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg btn-3d flex items-center justify-center gap-2"
              style={{ boxShadow: '0 5px 0 0 #059669' }}
            >
              <span>{s1Pass === 2 && s1Index === topic.words.length - 1 ? t('startPractice') : t('nextCard')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STAGE 2 & 3: MULTIPLE CHOICE QUIZ */}
        {(stage === 2 || stage === 3) && (() => {
          const isBgToEn = stage === 2;
          const queue = isBgToEn ? s2Queue : s3Queue;
          const idx = isBgToEn ? s2Index : s3Index;
          const options = isBgToEn ? s2Options : s3Options;
          const answered = isBgToEn ? s2Answered : s3Answered;
          const current = queue[idx];
          const field = isBgToEn ? 'en' : 'bg';

          const handleSelect = (optVal) => {
            if (answered) return;
            const isCorrect = normalizeAnswer(optVal) === normalizeAnswer(current[field]);
            setTotalAttempts((n) => n + 1);
            if (isCorrect) {
              setCorrectAttempts((n) => n + 1);
              speakEnglish(current.en);
            } else {
              recordMistake(current.id);
              if (navigator.vibrate) navigator.vibrate(70);
            }
            if (isBgToEn) setS2Answered({ selectedVal: optVal, isCorrect });
            else setS3Answered({ selectedVal: optVal, isCorrect });
          };

          const handleNext = () => {
            if (isBgToEn) {
              if (s2Index < s2Queue.length - 1) {
                setS2Index((i) => i + 1);
                setS2Answered(null);
              } else {
                setStage(3);
              }
            } else {
              if (s3Index < s3Queue.length - 1) {
                setS3Index((i) => i + 1);
                setS3Answered(null);
              } else {
                setStage(4);
              }
            }
          };

          return (
            <div className="animate-pop">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-extrabold text-slate-600">
                  {isBgToEn ? t('chooseEnTranslation') : t('chooseBgTranslation')}
                </span>
                <span className="text-xs font-extrabold text-slate-400">
                  {idx + 1} / {queue.length}
                </span>
              </div>

              <div className="bg-white rounded-3xl p-7 card-shadow border-2 border-slate-100 text-center mb-5">
                <div className="text-3xl sm:text-4xl font-black text-slate-800 break-words">
                  {isBgToEn ? current.bg : current.en}
                </div>
                {!isBgToEn && (
                  <button
                    onClick={() => speakEnglish(current.en)}
                    className="mt-4 inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-700 font-extrabold text-sm"
                  >
                    <Volume2 className="w-4 h-4" /> {t('listenWord')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {options.map((opt, i) => {
                  const val = opt[field];
                  const isCorrectOpt = normalizeAnswer(val) === normalizeAnswer(current[field]);
                  const isSelected = answered && answered.selectedVal === val;
                  let cls = 'bg-white border-slate-200 text-slate-800 hover:border-sky-400 hover:bg-sky-50/40';
                  if (answered) {
                    if (isCorrectOpt) cls = 'bg-emerald-500 border-emerald-600 text-white';
                    else if (isSelected) cls = 'bg-rose-500 border-rose-600 text-white animate-shake';
                    else cls = 'bg-white border-slate-200 text-slate-400 opacity-60';
                  }
                  return (
                    <button
                      key={`${val}-${i}`}
                      disabled={Boolean(answered)}
                      onClick={() => handleSelect(val)}
                      className={`py-4 px-5 rounded-2xl border-2 font-extrabold text-lg transition text-center ${cls}`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div
                  className={`p-4 rounded-2xl flex items-center justify-between gap-3 animate-pop ${
                    answered.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <div className="font-extrabold text-sm sm:text-base">
                    {answered.isCorrect ? (
                      <>🎉 {t('correctMsg')}</>
                    ) : (
                      <>
                        ❌ {t('wrongMsg')} <span className="underline">{current[field]}</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleNext}
                    className={`py-2.5 px-5 rounded-xl font-extrabold text-white shrink-0 ${
                      answered.isCorrect ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {t('continueBtn')}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* STAGE 4: MATCH PAIRS (5 PER BATCH) */}
        {stage === 4 && (() => {
          const batch = s4Batches[s4BatchIdx];
          return (
            <div className="animate-pop">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-extrabold text-slate-700">{t('matchInstruction')}</span>
                {s4Batches.length > 1 && (
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                    {t('batchIndicator', s4BatchIdx + 1, s4Batches.length)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3">
                  <div className="text-center text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    🇧🇬 {t('leftColBg')}
                  </div>
                  {batch.left.map((w) => {
                    const matched = s4Matched.includes(w.id);
                    const selected = s4SelLeft === w.id;
                    const isErr = s4Error?.left === w.id;
                    let cls = 'bg-white border-slate-200 text-slate-800 hover:border-sky-400';
                    if (matched) cls = 'bg-emerald-100 border-emerald-400 text-emerald-700 opacity-40 scale-95 pointer-events-none';
                    else if (isErr) cls = 'bg-rose-500 border-rose-600 text-white animate-shake';
                    else if (selected) cls = 'bg-sky-500 border-sky-600 text-white shadow-md scale-[1.02]';
                    return (
                      <button
                        key={w.id}
                        disabled={matched || Boolean(s4Error)}
                        onClick={() => {
                          const next = s4SelLeft === w.id ? null : w.id;
                          setS4SelLeft(next);
                          if (next && s4SelRight) evaluateMatch(next, s4SelRight);
                        }}
                        className={`w-full py-4 px-3 rounded-2xl border-2 font-extrabold text-base sm:text-lg transition break-words ${cls}`}
                      >
                        {w.bg}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <div className="text-center text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    🇬🇧 {t('rightColEn')}
                  </div>
                  {batch.right.map((w) => {
                    const matched = s4Matched.includes(w.id);
                    const selected = s4SelRight === w.id;
                    const isErr = s4Error?.right === w.id;
                    let cls = 'bg-white border-slate-200 text-slate-800 hover:border-sky-400';
                    if (matched) cls = 'bg-emerald-100 border-emerald-400 text-emerald-700 opacity-40 scale-95 pointer-events-none';
                    else if (isErr) cls = 'bg-rose-500 border-rose-600 text-white animate-shake';
                    else if (selected) cls = 'bg-sky-500 border-sky-600 text-white shadow-md scale-[1.02]';
                    return (
                      <button
                        key={w.id}
                        disabled={matched || Boolean(s4Error)}
                        onClick={() => {
                          const next = s4SelRight === w.id ? null : w.id;
                          setS4SelRight(next);
                          if (s4SelLeft && next) evaluateMatch(s4SelLeft, next);
                        }}
                        className={`w-full py-4 px-3 rounded-2xl border-2 font-extrabold text-base sm:text-lg transition break-words ${cls}`}
                      >
                        {w.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* STAGE 5 & 6: WRITTEN TRANSLATION */}
        {(stage === 5 || stage === 6) && (() => {
          const isEnToBg = stage === 5;
          const queue = isEnToBg ? s5Queue : s6Queue;
          const idx = isEnToBg ? s5Index : s6Index;
          const inputVal = isEnToBg ? s5Input : s6Input;
          const setInputVal = isEnToBg ? setS5Input : setS6Input;
          const feedback = isEnToBg ? s5Feedback : s6Feedback;
          const item = queue[idx];
          const word = isEnToBg ? item : item.word;
          const isRepeat = !isEnToBg && item.isRepeat;
          const expected = isEnToBg ? word.bg : word.en;

          const handleCheck = (e) => {
            e.preventDefault();
            if (!inputVal.trim() || feedback) return;
            const isCorrect = normalizeAnswer(inputVal) === normalizeAnswer(expected);
            setTotalAttempts((n) => n + 1);
            if (isCorrect) {
              setCorrectAttempts((n) => n + 1);
              speakEnglish(word.en);
            } else {
              recordMistake(word.id);
              if (navigator.vibrate) navigator.vibrate(70);
              if (!isEnToBg) {
                setS6Queue((prev) => [...prev, { word, isRepeat: true }]);
              }
            }
            if (isEnToBg) setS5Feedback({ isCorrect, expected });
            else setS6Feedback({ isCorrect, expected });
          };

          const handleNext = () => {
            if (isEnToBg) {
              if (s5Index < s5Queue.length - 1) {
                setS5Index((i) => i + 1);
                setS5Input('');
                setS5Feedback(null);
              } else {
                setStage(6);
              }
            } else {
              if (s6Index < s6Queue.length - 1) {
                setS6Index((i) => i + 1);
                setS6Input('');
                setS6Feedback(null);
              } else {
                setStage(7);
              }
            }
          };

          return (
            <div className="animate-pop">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-extrabold text-slate-600">
                  {isEnToBg ? t('typeBgInstruction') : t('typeEnInstruction')}
                </span>
                <span className="text-xs font-extrabold text-slate-400">
                  {idx + 1} / {queue.length}
                </span>
              </div>

              <div className="bg-white rounded-3xl p-7 card-shadow border-2 border-slate-100 text-center mb-5">
                {isRepeat && (
                  <span className="inline-block mb-2 text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                    🔁 {t('repeatBadge')}
                  </span>
                )}
                <div className="text-3xl sm:text-4xl font-black text-slate-800 break-words">
                  {isEnToBg ? word.en : word.bg}
                </div>
                {isEnToBg && (
                  <button
                    type="button"
                    onClick={() => speakEnglish(word.en)}
                    className="mt-4 inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-700 font-extrabold text-sm"
                  >
                    <Volume2 className="w-4 h-4" /> {t('listenWord')}
                  </button>
                )}
              </div>

              <form onSubmit={handleCheck} className="space-y-4">
                <input
                  type="text"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={Boolean(feedback)}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={isEnToBg ? t('typePlaceholderBg') : t('typePlaceholderEn')}
                  className={`w-full py-4 px-5 rounded-2xl border-2 text-center text-xl font-extrabold focus:outline-none transition ${
                    feedback
                      ? feedback.isCorrect
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-rose-500 bg-rose-50 text-rose-800 animate-shake'
                      : 'border-slate-300 bg-white focus:border-sky-500 text-slate-800'
                  }`}
                />

                {!feedback ? (
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg btn-3d"
                    style={{ boxShadow: '0 5px 0 0 #059669' }}
                  >
                    {t('checkAnswer')}
                  </button>
                ) : (
                  <div
                    className={`p-4 rounded-2xl animate-pop ${
                      feedback.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <div className="font-extrabold text-base mb-1">
                      {feedback.isCorrect ? (
                        <>🎉 {t('correctMsg')}</>
                      ) : (
                        <>
                          ❌ {t('wrongMsg')} <span className="underline">{expected}</span>
                        </>
                      )}
                    </div>
                    {!feedback.isCorrect && !isEnToBg && (
                      <div className="text-xs font-bold opacity-90 mb-2">🔁 {t('addedForRepeat')}</div>
                    )}
                    <button
                      type="button"
                      onClick={handleNext}
                      className={`w-full mt-2 py-3.5 rounded-xl font-extrabold text-white ${
                        feedback.isCorrect ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {t('continueBtn')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          );
        })()}

        {/* STAGE 7: SUMMARY */}
        {stage === 7 && (
          <div className="animate-pop text-center">
            <div className="bg-white rounded-3xl p-6 sm:p-8 card-shadow border-2 border-emerald-100 mb-6">
              <div className="text-5xl mb-3">🏆</div>
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3].map((i) => (
                  <span key={i} className={`text-4xl transition ${i <= stars ? 'scale-110' : 'opacity-25 grayscale'}`}>
                    ⭐
                  </span>
                ))}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mb-5">
                {accuracy === 100
                  ? t('congratsPerfect')
                  : accuracy >= 85
                    ? t('congratsGreat')
                    : accuracy >= 65
                      ? t('congratsGood')
                      : t('congratsKeepGoing')}
              </h1>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="text-2xl font-black text-amber-600">{stars}/3</div>
                  <div className="text-[11px] font-bold text-amber-700 mt-0.5">{t('starsEarned')}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                  <div className="text-2xl font-black text-sky-600">+{points}</div>
                  <div className="text-[11px] font-bold text-sky-700 mt-0.5">{t('pointsEarned')}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-2xl font-black text-emerald-600">{accuracy}%</div>
                  <div className="text-[11px] font-bold text-emerald-700 mt-0.5">{t('accuracyLabel')}</div>
                </div>
              </div>

              <div className="text-left bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
                  {t('mistakesTitle')}
                </div>
                {mistakeList.length === 0 ? (
                  <div className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> {t('noMistakesCongrats')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mistakeList.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-rose-100"
                      >
                        <div className="text-sm font-bold">
                          <span className="text-slate-800">{w.bg}</span>
                          <span className="text-slate-300 mx-1.5">—</span>
                          <span className="text-emerald-700">{w.en}</span>
                        </div>
                        <button
                          onClick={() => speakEnglish(w.en)}
                          className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg btn-3d"
              style={{ boxShadow: '0 5px 0 0 #059669' }}
            >
              {t('returnToTopicsBtn')}
            </button>
          </div>
        )}
      </main>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 animate-pop">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
            <p className="text-slate-800 font-bold text-lg mb-6">{t('exitLessonDesc')}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={onExit}
                className="py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 font-bold text-white"
              >
                {t('exitBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
