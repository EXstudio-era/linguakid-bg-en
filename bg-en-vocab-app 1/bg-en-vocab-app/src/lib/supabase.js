import { createClient } from '@supabase/supabase-js';

let cachedClient = null;
let cachedKeySignature = '';

export function getSupabaseClient(customUrl = '', customKey = '') {
  const url = (customUrl || import.meta.env.VITE_SUPABASE_URL || '').trim();
  const key = (customKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key || !url.startsWith('https://')) return null;

  const sig = `${url}::${key}`;
  if (cachedClient && cachedKeySignature === sig) return cachedClient;

  cachedClient = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 10 } }
  });
  cachedKeySignature = sig;
  return cachedClient;
}

export async function fetchFamilyData(client, familyCode) {
  const fc = familyCode.toUpperCase();
  const [topicsRes, wordsRes, progRes] = await Promise.all([
    client.from('topics').select('*').eq('family_code', fc).order('created_at', { ascending: true }),
    client.from('words').select('*').eq('family_code', fc).order('created_at', { ascending: true }),
    client.from('progress').select('*').eq('family_code', fc)
  ]);

  if (topicsRes.error) throw topicsRes.error;
  if (wordsRes.error) throw wordsRes.error;
  if (progRes.error) throw progRes.error;

  const topics = (topicsRes.data || []).map((tp) => ({
    id: tp.id,
    title: tp.title,
    emoji: tp.emoji || '📚',
    color: tp.color || 'emerald',
    words: (wordsRes.data || [])
      .filter((w) => w.topic_id === tp.id)
      .map((w) => ({ id: w.id, bg: w.bg, en: w.en }))
  }));

  const progress = {};
  (progRes.data || []).forEach((p) => {
    progress[p.topic_id] = {
      status: p.status,
      currentStage: p.current_stage || 1,
      bestAccuracy: p.best_accuracy || 0,
      lastAccuracy: p.last_accuracy || 0,
      stars: p.stars || 0,
      points: p.points || 0,
      mistakeWords: Array.isArray(p.mistake_words) ? p.mistake_words : []
    };
  });

  return { topics, progress };
}

export async function upsertTopic(client, familyCode, topic) {
  if (!client) return;
  await client.from('topics').upsert({
    id: topic.id,
    family_code: familyCode.toUpperCase(),
    title: topic.title,
    emoji: topic.emoji,
    color: topic.color
  });
}

export async function removeTopic(client, topicId) {
  if (!client) return;
  await client.from('topics').delete().eq('id', topicId);
}

export async function upsertWord(client, familyCode, topicId, word) {
  if (!client) return;
  await client.from('words').upsert({
    id: word.id,
    topic_id: topicId,
    family_code: familyCode.toUpperCase(),
    bg: word.bg,
    en: word.en
  });
}

export async function removeWord(client, wordId) {
  if (!client) return;
  await client.from('words').delete().eq('id', wordId);
}

export async function upsertProgress(client, familyCode, topicId, prog) {
  if (!client) return;
  await client.from('progress').upsert(
    {
      family_code: familyCode.toUpperCase(),
      topic_id: topicId,
      status: prog.status,
      current_stage: prog.currentStage || 1,
      best_accuracy: prog.bestAccuracy || 0,
      last_accuracy: prog.lastAccuracy || 0,
      stars: prog.stars || 0,
      points: prog.points || 0,
      mistake_words: prog.mistakeWords || [],
      updated_at: new Date().toISOString()
    },
    { onConflict: 'family_code,topic_id' }
  );
}
