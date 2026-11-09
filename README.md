# BerkasSiap

Aplikasi web (mobile-first) untuk mengecek persyaratan dokumen, membuat checklist, mengatur tenggat, dan menyimpan salinan berkas di perangkatmu. Tidak butuh server atau akun: semua data tersimpan di browser (localStorage + IndexedDB).

## Jalankan lokal

Butuh Node.js 20+.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # hasil di folder dist/
```

## Deploy ke GitHub Pages

1. Buat repo di GitHub, lalu push semua file ini ke branch `main`.
2. Di repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Setiap push ke `main` akan membangun dan menerbitkan situs otomatis (lihat tab *Actions*).

Alamatnya: `https://<username>.github.io/<nama-repo>/`

## Mengubah daftar layanan

Edit `src/data/templates.ts`. Panduan di dalamnya bersifat umum; syarat resmi bisa berbeda per daerah dan berubah sewaktu-waktu, jadi cek situs instansi terkait.

## Catatan privasi

File yang diunggah ke checklist hanya disimpan di browser perangkat ini dan tidak dikirim ke mana pun. Menghapus data browser akan menghapusnya juga.
