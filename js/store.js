// Penyimpanan local-first: selalu ke localStorage, lalu disinkronkan ke Supabase bila sudah login.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const KEY = "ielts-vocab-v3", OLD_KEY = "ielts-vocab-v2";
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
const blank = () => ({ c: {}, st: 0, last: "", n: {}, limit: 5, su: 0, dirty: [] });

let S = blank(), sb = null, user = null;
export const get = () => S;
export const getUser = () => user;
export const cloudReady = () => !!sb;

const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
const mark = (k) => { if (!S.dirty.includes(k)) S.dirty.push(k); };

function load() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY);
    if (raw) S = { ...blank(), ...JSON.parse(raw) };
    for (const w in S.c) S.c[w].u ??= Date.now();
  } catch {}
}

export async function init() {
  load();
  if (typeof window !== "undefined") window.addEventListener("online", () => flush());
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const { createClient } = await import(SUPABASE_CDN);
    sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await sb.auth.getSession();
    user = data.session?.user ?? null;
    if (user) await pull();
  } catch (e) { console.warn("Supabase tidak tersedia:", e); sb = null; }
}

export async function signIn(email, password, createAccount) {
  const call = createAccount ? sb.auth.signUp({ email, password }) : sb.auth.signInWithPassword({ email, password });
  const { data, error } = await call;
  if (error) throw error;
  user = data.session?.user ?? null; // null bila email perlu dikonfirmasi dulu
  if (user) await pull();
  return !!user;
}
export async function signOut() { await sb.auth.signOut(); user = null; }

const cardRow = (w) => ({ user_id: user.id, word: w, box: S.c[w].box, due: S.c[w].due, updated_at: new Date(S.c[w].u).toISOString() });

export async function flush() {
  if (!sb || !user || !S.dirty.length) return true;
  const batch = [...S.dirty], words = batch.filter((k) => k !== "__state");
  try {
    if (words.length) {
      const { error } = await sb.from("card_progress").upsert(words.map(cardRow), { onConflict: "user_id,word" });
      if (error) throw error;
    }
    if (batch.includes("__state")) {
      const { st, last, n, limit, su } = S;
      const { error } = await sb.from("user_state").upsert({ user_id: user.id, data: { st, last, n, limit }, updated_at: new Date(su || Date.now()).toISOString() });
      if (error) throw error;
    }
    S.dirty = S.dirty.filter((k) => !batch.includes(k));
    persist();
    return true;
  } catch (e) { console.warn("Sinkron gagal:", e); return false; }
}

// Gabungkan data cloud dan lokal: yang paling baru menang per kartu.
async function pull() {
  const [a, b] = await Promise.all([
    sb.from("card_progress").select("word,box,due,updated_at"),
    sb.from("user_state").select("data,updated_at").maybeSingle(),
  ]);
  if (a.error || b.error) throw a.error || b.error;
  const remote = {};
  a.data.forEach((r) => {
    const t = Date.parse(r.updated_at);
    remote[r.word] = t;
    if (!S.c[r.word] || S.c[r.word].u < t) S.c[r.word] = { box: r.box, due: r.due, u: t };
  });
  for (const w in S.c) if (!(w in remote) || S.c[w].u > remote[w]) mark(w);
  const rs = b.data ? Date.parse(b.data.updated_at) : 0;
  if (rs > (S.su || 0)) Object.assign(S, b.data.data, { su: rs }); else mark("__state");
  persist();
  await flush();
}

export function setCard(word, box, due) { S.c[word] = { box, due, u: Date.now() }; mark(word); persist(); flush(); }
export function setMeta(patch) { Object.assign(S, patch, { su: Date.now() }); mark("__state"); persist(); flush(); }

export function importState(obj) {
  S = { ...blank(), ...obj, dirty: [] };
  for (const w in S.c) { S.c[w].u = Date.now(); mark(w); }
  mark("__state"); persist(); flush();
}

export async function resetAll() {
  if (sb && user) {
    await sb.from("card_progress").delete().eq("user_id", user.id);
    await sb.from("user_state").delete().eq("user_id", user.id);
  }
  S = blank(); persist();
}
