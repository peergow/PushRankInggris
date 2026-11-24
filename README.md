# IELTS Vocab Harian

Aplikasi belajar vocabulary IELTS harian: kata baru + review dengan spaced repetition (sistem kotak, jeda 1, 2, 4, 8, 16, 30 hari), filter per topik, dan latihan Speaking/Writing. Tanpa server, tanpa build, hanya HTML + CSS + JS + JSON.

## Pasang di GitHub Pages
1. Buat repository baru di GitHub (misalnya `ielts-vocab`).
2. Klik **Add file > Upload files**, lalu unggah **isi** folder ini (bukan zipnya), commit.
3. Buka **Settings > Pages**, pada Source pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu Save.
4. Tunggu 1 sampai 2 menit, lalu buka `https://USERNAME.github.io/ielts-vocab/`.

## Coba di komputer
Klik dua kali `index.html` tidak berfungsi karena browser memblokir pemuatan JSON. Jalankan:
```
python -m http.server 8000
```
lalu buka http://localhost:8000.

## Isi saat ini
500 kata di 10 topik IELTS, 50 kata per topik (akademik dan kasual: phrasal verb dan idiom). Kata diurutkan bergantian antar topik, jadi mode Semua memberi campuran. Prompt Speaking/Writing pada kata baru memakai prompt umum per topik; boleh diganti per kata.

## Menambah kata
Edit `data/words.json`. Satu kata:
```json
{
 "w": "mitigate",
 "p": "verb",
 "topic": "Environment",
 "id": "mengurangi dampak / meredakan",
 "ex": "Governments should invest in green energy to mitigate the effects of climate change.",
 "col": ["mitigate the effects of", "mitigate the risk"],
 "syn": ["alleviate", "reduce"],
 "pa": ["reduce the impact of pollution", "mitigate the impact of pollution"],
 "sp": "Prompt Speaking",
 "wr": "Prompt Writing"
}
```
Aturan penting:
- `ex` harus memuat kata `w` apa adanya (dipakai untuk soal isian).
- `col` sebaiknya memuat kata `w` juga.
- `topic` bebas; topik baru otomatis muncul di menu filter.
- Pastikan JSON valid (koma antar objek, tanpa koma di akhir).
- Verifikasi collocations di Cambridge Dictionary atau Oxford Collocations Dictionary sebelum dipakai untuk Writing.

## Progress
Tersimpan di browser (localStorage), per perangkat. Untuk pindah perangkat, buka tab **Statistik**, salin teks Backup, lalu tempel di perangkat lain dan klik **Pulihkan**.
