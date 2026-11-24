import * as store from "./store.js";
import { start } from "./ui.js";

try {
  const words = await (await fetch("data/words.json")).json();
  await store.init();
  start(words);
} catch (e) {
  console.error(e);
  document.getElementById("v").innerHTML =
    '<div class="card bad">Gagal memuat data. Buka lewat GitHub Pages atau server lokal (python -m http.server), bukan klik dua kali file.</div>';
}
