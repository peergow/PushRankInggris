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

## Struktur
```
index.html, style.css
js/app.js      mulai aplikasi
js/ui.js       tampilan dan interaksi
js/srs.js      logika spaced repetition
js/store.js    penyimpanan lokal + sinkron Supabase
js/config.js   URL dan anon key Supabase (isi sendiri)
data/words.json   wordlist
supabase/schema.sql   tabel dan aturan keamanan
```

## Sinkron dengan Supabase (opsional)
Tanpa Supabase, progress tersimpan di browser (per perangkat). Dengan Supabase, progress ikut ke semua perangkat.
1. Buat project di supabase.com.
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu Run (cukup sekali).
3. Buka **Project Settings > API**, salin Project URL dan anon (publishable) key ke `js/config.js`. Jangan pernah memakai service_role key di sini. Anon key aman terlihat di browser hanya karena Row Level Security di schema.sql aktif.
4. Di **Authentication > URL Configuration**, isi Site URL dengan alamat GitHub Pages-mu. Untuk pemakaian pribadi, kamu boleh mematikan "Confirm email" di pengaturan provider Email supaya bisa langsung masuk setelah daftar.
5. Unggah ke GitHub, buka aplikasi, lalu tab **Akun**: Daftar atau Masuk. Progress lokal yang sudah ada otomatis digabung dengan data cloud (yang paling baru menang per kartu).

Perubahan saat offline disimpan dulu dan dikirim otomatis saat online lagi. Kolom `limit` (kata baru per hari) tersimpan di cloud dan bisa diubah lewat `S.limit` di `store.js` (nilai awal 5).
