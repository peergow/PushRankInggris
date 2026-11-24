import * as store from "./store.js";
import { today, nextBox, buildQueue, INTERVALS, streakAfter } from "./srs.js";

const $ = (id) => document.getElementById(id);
const chips = (a) => a.map((x) => `<span class="chip">${x}</span>`).join("");
const mask = (s, w) => s.replace(new RegExp("\\b" + w + "\\w*", "i"), "_____");

let W = [], tab = "study", topic = "Semua", Q = [], revealed = false, pi = 0, msg = "";
const pool = () => W.filter((w) => topic === "Semua" || w.topic === topic);
const prodList = () => { const S = store.get(), p = pool(), l = p.filter((w) => S.c[w.w]); return l.length ? l : p; };
const rebuild = () => { Q = buildQueue(W, store.get(), topic); revealed = false; };

export function start(words) {
  W = words;
  rebuild(); draw();
  document.addEventListener("click", onClick);
  document.addEventListener("change", (e) => { if (e.target.id === "tp") { topic = e.target.value; rebuild(); draw(); } });
}

async function onClick(e) {
  const el = e.target.closest("[data-a]");
  if (!el) return;
  const a = el.dataset.a;
  if (a === "tab") { tab = el.dataset.t; msg = ""; if (tab === "study") rebuild(); }
  else if (a === "reveal") revealed = true;
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
  const box = x.isNew ? 1 : nextBox(S.c[x.w.w].box, g);
  store.setCard(x.w.w, box, today(INTERVALS[box]));
  store.setMeta({ ...streakAfter(S), n: { ...S.n, [t]: (S.n[t] || 0) + (x.isNew ? 1 : 0) } });
  Q.shift(); revealed = false;
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
    if (!Q.length) return `<div class="card"><div class="w">Selesai hari ini 🎉</div><p class="mut">Tidak ada kartu jatuh tempo dan kuota kata baru sudah terpakai. Coba tab Latihan.</p></div>`;
    const x = Q[0], btn = (a, label, cls = "", g = "") => `<button class="btn ${cls}" data-a="${a}" data-g="${g}">${label}</button>`;
    let h = `<p class="mut">Sisa ${Q.length} kartu · ${x.isNew ? "kata baru" : "review"}</p>`;
    if (x.isNew) return h + card(x.w) + btn("grade", "Mengerti, jadwalkan ulang", "", 2);
    if (!revealed) return h + `<div class="card"><div class="lbl">Kata apa yang cocok?</div><p class="q">${mask(x.w.ex, x.w.w)}</p><div class="mut">${x.w.id}</div></div>` + btn("reveal", "Tampilkan jawaban");
    return h + card(x.w) + `<div class="row">${btn("grade", "Lupa", "o", 0)}${btn("grade", "Susah", "o", 1)}${btn("grade", "Ingat", "", 2)}</div>`;
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
  const tabs = [["study", "Belajar"], ["prod", "Latihan"], ["stats", "Statistik"], ["account", "Akun"]];
  const topics = ["Semua", ...new Set(W.map((w) => w.topic))];
  $("tabs").innerHTML = tabs.map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-a="tab" data-t="${k}">${l}</button>`).join("") +
    `<select id="tp">${topics.map((x) => `<option${x === topic ? " selected" : ""}>${x}</option>`).join("")}</select>`;
  $("v").innerHTML = views[tab]();
}
