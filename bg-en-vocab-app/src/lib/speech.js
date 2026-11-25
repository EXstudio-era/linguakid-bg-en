export function speakEnglish(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang?.toLowerCase().startsWith('en-us')) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith('en'));
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
  } catch {
    // Graceful no-op if speech API is blocked
  }
}

export function normalizeAnswer(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function parseBulkLines(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s*(?:—|–|-|:|=|\t)\s*/);
      if (parts.length < 2) return null;
      const bg = parts[0].trim();
      const en = parts.slice(1).join(' - ').trim();
      return bg && en ? { bg, en } : null;
    })
    .filter(Boolean);
}
