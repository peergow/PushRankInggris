// Logika spaced repetition (sistem kotak). Tanpa akses DOM atau jaringan.
export const INTERVALS = [0, 1, 2, 4, 8, 16, 30]; // hari per level kotak (1..6)

export const today = (offset = 0) =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 6e4 + offset * 864e5).toISOString().slice(0, 10);

// grade: 0 = lupa, 1 = susah, 2 = ingat
export const nextBox = (box, grade) => (grade === 0 ? 1 : grade === 1 ? box : Math.min(box + 1, 6));

export function buildQueue(words, S, topic) {
  const t = today();
  const pool = words.filter((w) => topic === "Semua" || w.topic === topic);
  const due = pool.filter((w) => S.c[w.w] && S.c[w.w].due <= t).map((w) => ({ w, isNew: false }));
  const room = Math.max(0, S.limit - (S.n[t] || 0));
  const fresh = pool.filter((w) => !S.c[w.w]).slice(0, room).map((w) => ({ w, isNew: true }));
  return due.concat(fresh);
}

export function streakAfter(S) {
  const t = today();
  if (S.last === t) return { st: S.st, last: t };
  return { st: S.last === today(-1) ? S.st + 1 : 1, last: t };
}
