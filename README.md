# Meadow Pass

Buatkan UI/UX dan frontend untuk sistem tiket masuk tempat wisata. Sistem ini punya 2 halaman utama:

1. HALAMAN KASIR (buat petugas di loket)

- Form input: kategori tiket (dewasa/anak), jumlah tiket

- Tombol "Buat Tiket" yang generate QR code unik per transaksi

- Setelah generate, tampilkan QR code besar di layar (siap di-scan atau di-screenshot pengunjung), lengkap dengan detail: kode tiket, kategori, jumlah, harga, waktu beli

- Tombol "Cetak" atau "Transaksi Baru" untuk lanjut ke tiket berikutnya

2. HALAMAN SCAN (buat petugas di pintu masuk)

- Buka kamera device untuk scan QR code

- Setelah scan berhasil, tampilkan hasil validasi dengan jelas:

  - Kalau tiket VALID/belum dipakai: tampilan hijau besar, tulisan "BOLEH MASUK", tampilkan detail tiket

  - Kalau tiket SUDAH DIPAKAI: tampilan merah besar, tulisan "TIKET SUDAH DIGUNAKAN"

  - Kalau tiket TIDAK VALID: tampilan merah, "TIKET TIDAK DITEMUKAN"

- Tampilkan juga counter jumlah pengunjung yang sudah masuk hari ini di pojok layar

3. HALAMAN LAPORAN (opsional, buat rekap harian)

- Total tiket terjual hari ini

- Total pendapatan hari ini

- Breakdown per kategori (dewasa/anak)

- List riwayat transaksi terbaru

GAYA DESAIN:

- Tema natural/outdoor/farm-ranch, terinspirasi dari suasana tempat wisata asli: banyak kayu, rumput hijau, langit terbuka, nuansa hangat dan homey - Palet warna: hijau natural, coklat kayu, krem/tan, dengan aksen warna cerah (kuning/oranye) untuk tombol penting - Tombol dan teks besar/jelas karena akan dipakai petugas di lapangan (outdoor, kadang di bawah sinar matahari), bukan di kantor - Mobile-friendly karena akan diakses dari HP/tablet - Font mudah dibaca dari jarak agak jauh (untuk hasil scan di pintu masuk) - Hindari gaya terlalu "digital/futuristik" — buat terasa hangat dan ramah keluarga, sesuai suasana tempat wisata outdoor

Untuk sekarang cukup buat UI/UX dan frontend-nya dulu (pakai data dummy/mock untuk generate & validasi QR), backend beneran akan disambungkan terpisah nanti.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://trail-ticket-tally.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/800c53a0-1124-4635-8682-19ca2d22b187).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
