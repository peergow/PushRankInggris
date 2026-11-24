import * as store from "./store.js";
import { today, nextBox, buildQueue, INTERVALS, streakAfter } from "./srs.js";

const $ = (id) => document.getElementById(id);
const chips = (a) => a.map((x) => `<span class="chip">${x}</span>`).join("");
const mask = (s, w) => s.replace(new RegExp("\\b" + w + "\\w*", "i"), "_____");

let W = [], tab = "study", topic = "Semua", Q = [], revealed = false, pi = 0, msg = "";
let hist = [], free = false, search = "", sf = "all", open = "";
const pool = () => W.filter((w) => topic === "Semua" || w.topic === topic);
const prodList = () => { const S = store.get(), p = pool(), l = p.filter((w) => S.c[w.w]); return l.length ? l : p; };
const rebuild = () => { Q = buildQueue(W, store.get(), topic); revealed = false; free = false; hist = []; };

export function start(words) {
  W = words;
  rebuild(); draw();
  document.addEventListener("click", onClick);
  document.addEventListener("change", (e) => {
    if (e.target.id === "tp") { topic = e.target.value; rebuild(); draw(); }
    if (e.target.id === "sf") { sf = e.target.value; $("wl").innerHTML = list(); }
  });
  document.addEventListener("input", (e) => { if (e.target.id === "q") { search = e.target.value; $("wl").innerHTML = list(); } });
}

async function onClick(e) {
  const el = e.target.closest("[data-a]");
  if (!el) return;
  const a = el.dataset.a;
  if (a === "tab") { tab = el.dataset.t; msg = ""; if (tab === "study") rebuild(); }
  else if (a === "reveal") revealed = true;
  else if (a === "undo") undo();
  else if (a === "free") startFree();
  else if (a === "sched") rebuild();
  else if (a === "open") open = open === el.dataset.w ? "" : el.dataset.w;
  else if (a === "queue" || a === "again") studyNow(el.dataset.w, a === "again");
  else if (a === "grade") grade(+el.dataset.g);
  else if (a === "next") pi++;
  else if (a === "check") return check();
  else if (a === "signin" || a === "signup") await auth(a === "signup");
  else if (a === "signout") { await store.signOut(); rebuild(); msg = "Sudah keluar."; }
  else if (a === "sync") msg = (await store.flush()) ? "Sinkron selesai." : "Gagal sinkron. Coba lagi saat online.";
  else if (a === "restore") restore();
  else if (a === "reset" && confirm("Hapus semua progress (termasuk di cloud)?")) { await store.resetAll(); rebuild(); }
  draw();
}

function grade(g) {
  const S = store.get(), x = Q[0], t = today();
  if (free) { if (g === 0) Q.push(x); Q.shift(); revealed = false; return; } // latihan bebas: jadwal tidak berubah
  const w = x.w.w, prev = S.c[w] ? { box: S.c[w].box, due: S.c[w].due } : null;
  hist.push({ item: x, prev, meta: { st: S.st, last: S.last, n: { ...S.n } } });
  const box = x.isNew ? 1 : nextBox(S.c[w].box, g);
  store.setCard(w, box, today(INTERVALS[box]));
  store.setMeta({ ...streakAfter(S), n: { ...S.n, [t]: (S.n[t] || 0) + (x.isNew ? 1 : 0) } });
  Q.shift(); revealed = false;
}

// Kembali ke kartu sebelumnya dan batalkan penilaiannya.
function undo() {
  const h = hist.pop(); if (!h) return;
  const w = h.item.w.w;
  if (h.prev) store.setCard(w, h.prev.box, h.prev.due); else store.removeCard(w);
  store.setMeta(h.meta);
  Q.unshift(h.item); revealed = !h.item.isNew;
}

// Latihan ekstra kapan saja tanpa mengubah jadwal.
function startFree() {
  const S = store.get(), p = pool(), l = p.filter((w) => S.c[w.w]);
  Q = [...(l.length ? l : p)].sort(() => Math.random() - 0.5).slice(0, 20).map((w) => ({ w, isNew: false }));
  free = true; hist = []; revealed = false;
}

// Dari Daftar: pelajari kata baru sekarang, atau ulangi kata lama sekarang juga.
function studyNow(word, again) {
  const w = W.find((x) => x.w === word), c = store.get().c[word];
  if (again && c) store.setCard(word, c.box, today());
  free = false; hist = []; revealed = false; tab = "study";
  Q = Q.filter((x) => x.w.w !== word); Q.unshift({ w, isNew: !c });
}

function list() {
  const S = store.get(), t = today(), s = search.trim().toLowerCase();
  const html = pool().filter((w) => {
    const c = S.c[w.w], st = !c ? "new" : c.box >= 5 ? "done" : "learn";
    if (sf === "due" ? !(c && c.due <= t) : sf !== "all" && sf !== st) return false;
    return !s || w.w.toLowerCase().includes(s) || w.id.toLowerCase().includes(s);
  }).map((w) => {
    const c = S.c[w.w], badge = !c ? "Belum" : "Level " + c.box + (c.due <= t ? " · jatuh tempo" : "");
    const act = open === w.w ? card(w) + `<button class="btn" data-a="${c ? "again" : "queue"}" data-w="${w.w}">${c ? "Ulangi sekarang" : "Pelajari sekarang"}</button>` : "";
    return `<div class="card"><div class="row" style="justify-content:space-between" data-a="open" data-w="${w.w}"><span><b>${w.w}</b> <span class="mut">${w.id}</span></span><span class="chip">${badge}</span></div>${act}</div>`;
  }).join("");
  return html || '<p class="mut">Tidak ada kata yang cocok.</p>';
}

async function auth(createAccount) {
  try {
    const ok = await store.signIn($("em").value.trim(), $("pw").value, createAccount);
    msg = ok ? "Berhasil masuk. Progress digabung dan disinkronkan." : "Akun dibuat. Cek email untuk konfirmasi, lalu masuk.";
    rebuild();
  } catch (err) { msg = "Gagal: " + err.message; }
}

function restore() {
  try { const o = JSON.parse($("bk").value); if (!o || !o.c) throw 0; store.importState(o); rebuild(); msg = "Backup dipulihkan."; }
  catch { msg = "Format backup tidak valid."; }
}

function check() {
  const L = prodList(), x = L[pi % L.length], t = $("ta").value.toLowerCase();
  const n = t.split(/\s+/).filter(Boolean).length, st = x.w.slice(0, -1);
  const hasWord = new RegExp("\\b" + st).test(t);
  const hasCol = x.col.some((c) => new RegExp(c.toLowerCase().replace(x.w, st + "\\w*")).test(t));
  const hasSyn = x.syn.some((s) => t.includes(s));
  const li = (ok, yes, no) => `<span class="${ok ? "good" : "bad"}">${ok ? "✓ " + yes : "✗ " + no}</span>`;
  $("res").innerHTML = [li(hasWord, "Kata target dipakai.", "Kata target belum dipakai."),
    li(hasCol, "Ada collocation.", "Belum ada collocation utuh."),
    li(n >= 20, n + " kata.", "Baru " + n + " kata, targetkan 20+."),
    hasSyn ? '<span class="mut">Synonym juga terpakai, bagus untuk variasi.</span>' : ""].filter(Boolean).join("<br>");
}

const card = (x) => `<div class="card"><span class="w">${x.w}</span><span class="pos">${x.p} · ${x.topic}</span><div>${x.id}</div>
<div class="lbl">Contoh</div><div class="ex">${x.ex}</div><div class="lbl">Collocations</div>${chips(x.col)}
<div class="lbl">Synonyms</div>${chips(x.syn)}<div class="lbl">Paraphrase</div><div class="mut">${x.pa[0]} → <b class="good">${x.pa[1]}</b></div></div>`;

const views = {
  study() {
    const btn = (a, label, cls = "", g = "") => `<button class="btn ${cls}" data-a="${a}" data-g="${g}">${label}</button>`;
    const back = hist.length ? btn("undo", "↩ Kembali", "o") : "";
    const foot = `<div class="row" style="margin-top:12px">${free ? btn("sched", "Kembali ke jadwal", "o") : btn("free", "Latihan bebas", "o")}</div>`;
    if (!Q.length) return `<div class="card"><div class="w">${free ? "Latihan bebas selesai" : "Selesai hari ini 🎉"}</div><p class="mut">${free ? "Jadwal belajarmu tidak berubah." : "Tidak ada kartu jatuh tempo dan kuota kata baru sudah terpakai. Kamu tetap bisa memakai Latihan bebas atau membuka Daftar untuk mengulang kata apa pun."}</p>${back}</div>` + foot;
    const x = Q[0];
    let h = `<p class="mut">${free ? "Latihan bebas, jadwal tidak berubah · " : ""}Sisa ${Q.length} kartu · ${x.isNew ? "kata baru" : "review"}</p>`;
    if (x.isNew) h += card(x.w) + `<div class="row">${back}${btn("grade", "Mengerti, jadwalkan ulang", "", 2)}</div>`;
    else if (!revealed) h += `<div class="card"><div class="lbl">Kata apa yang cocok?</div><p class="q">${mask(x.w.ex, x.w.w)}</p><div class="mut">${x.w.id}</div></div><div class="row">${back}${btn("reveal", "Tampilkan jawaban")}</div>`;
    else h += card(x.w) + `<div class="row">${back}${btn("grade", "Lupa", "o", 0)}${btn("grade", "Susah", "o", 1)}${btn("grade", "Ingat", "", 2)}</div>`;
    return h + foot;
  },
  words() {
    const opts = [["all", "Semua status"], ["new", "Belum dipelajari"], ["learn", "Sedang dipelajari"], ["due", "Jatuh tempo"], ["done", "Dikuasai (level 5+)"]];
    return `<div class="card"><input id="q" type="search" placeholder="Cari kata atau arti" value="${search.replace(/"/g, "&quot;")}"><select id="sf">${opts.map(([v, l]) => `<option value="${v}"${v === sf ? " selected" : ""}>${l}</option>`).join("")}</select></div><div id="wl">${list()}</div>`;
  },
  prod() {
    const L = prodList(); if (!L.length) return "";
    const x = L[pi % L.length];
    return `<div class="card"><div class="w">${x.w}</div><div class="lbl">Speaking</div><div>${x.sp}</div><div class="lbl">Writing</div><div>${x.wr}</div>
<div class="lbl">Jawabanmu (pakai kata ini + 1 collocation, 20+ kata)</div><textarea id="ta"></textarea>
<div class="row" style="margin-top:8px"><button class="btn" data-a="check">Cek</button><button class="btn o" data-a="next">Kata lain</button></div>
<p id="res"></p><div class="lbl">Collocations untuk dicoba</div>${chips(x.col)}</div>`;
  },
  stats() {
    const S = store.get(), t = today(), box = [0, 0, 0, 0, 0, 0, 0];
    let due = 0; W.forEach((w) => { const c = S.c[w.w]; if (c) { box[c.box]++; if (c.due <= t) due++; } });
    const topics = [...new Set(W.map((w) => w.topic))].map((tp) => {
      const all = W.filter((w) => w.topic === tp), l = all.filter((w) => S.c[w.w]).length;
      return `<div>${tp}: ${l}/${all.length}<div class="bar"><i style="width:${(l / all.length) * 100}%"></i></div></div>`;
    }).join("");
    return `<div class="card"><div class="lbl">Ringkasan</div>Total ${W.length} · dipelajari ${Object.keys(S.c).length} · jatuh tempo ${due} · streak ${S.st} hari · kata baru/hari ${S.limit}</div>
<div class="card"><div class="lbl">Per level (1 baru, 6 dikuasai)</div>${[1, 2, 3, 4, 5, 6].map((i) => `Level ${i}: ${box[i]}`).join(" · ")}</div>
<div class="card"><div class="lbl">Per topik</div>${topics}</div>
<div class="card"><div class="lbl">Backup (salin untuk pindah perangkat)</div><textarea id="bk">${JSON.stringify(S)}</textarea>
<div class="row" style="margin-top:8px"><button class="btn o" data-a="restore">Pulihkan</button><button class="btn o" data-a="reset">Reset</button></div></div>`;
  },
  account() {
    const u = store.getUser(), S = store.get();
    const note = msg ? `<p class="mut">${msg}</p>` : "";
    if (!store.cloudReady()) return `<div class="card"><div class="lbl">Mode lokal</div>Supabase belum dikonfigurasi di <code>js/config.js</code>, jadi progress hanya tersimpan di browser ini.${note}</div>`;
    if (!u) return `<div class="card"><div class="lbl">Masuk untuk sinkron antar perangkat</div><input id="em" type="email" placeholder="Email" autocomplete="email"><input id="pw" type="password" placeholder="Password (min. 6 karakter)" autocomplete="current-password">
<div class="row" style="margin-top:8px"><button class="btn" data-a="signin">Masuk</button><button class="btn o" data-a="signup">Daftar</button></div>${note}</div>`;
    return `<div class="card"><div class="lbl">Akun</div>${u.email}<p class="mut">${S.dirty.length ? S.dirty.length + " perubahan menunggu sinkron" : "Semua perubahan sudah tersinkron"}</p>
<div class="row"><button class="btn" data-a="sync">Sinkronkan sekarang</button><button class="btn o" data-a="signout">Keluar</button></div>${note}</div>`;
  },
};

function draw() {
  const S = store.get(), t = today();
  const due = W.filter((w) => S.c[w.w] && S.c[w.w].due <= t).length;
  const where = store.cloudReady() ? (store.getUser() ? "☁ cloud" : "☁ belum masuk") : "lokal";
  $("head").textContent = `Streak ${S.st} hari · ${Object.keys(S.c).length}/${W.length} dipelajari · ${due} jatuh tempo · ${where}`;
  const tabs = [["study", "Belajar"], ["words", "Daftar"], ["prod", "Latihan"], ["stats", "Statistik"], ["account", "Akun"]];
  const topics = ["Semua", ...new Set(W.map((w) => w.topic))];
  $("tabs").innerHTML = tabs.map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-a="tab" data-t="${k}">${l}</button>`).join("") +
    `<select id="tp">${topics.map((x) => `<option${x === topic ? " selected" : ""}>${x}</option>`).join("")}</select>`;
  $("v").innerHTML = views[tab]();
}
