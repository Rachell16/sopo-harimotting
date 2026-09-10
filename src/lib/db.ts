import { neon } from "@neondatabase/serverless";

// Kalau DATABASE_URL belum diisi (misal lagi coba lokal tanpa setup database),
// aplikasi otomatis jalan di MODE_DEMO: data disimpan sementara di memori server
// (lihat tickets.server.ts), bukan ke Postgres. Cukup buat lihat-lihat tampilan;
// datanya hilang kalau server di-restart. Begitu DATABASE_URL diisi, otomatis
// pindah ke database beneran tanpa perlu ubah kode apa pun.
export const MODE_DEMO = !process.env.DATABASE_URL;

export const sql = MODE_DEMO
  ? (undefined as unknown as ReturnType<typeof neon>)
  : neon(process.env.DATABASE_URL!);

let sudahSiap = false;

// Dipanggil di awal setiap server function. Aman dipanggil berkali-kali —
// CREATE TABLE IF NOT EXISTS tidak akan error kalau tabel sudah ada.
export async function pastikanSkema() {
  if (MODE_DEMO || sudahSiap) return;
  await sql`
    CREATE TABLE IF NOT EXISTS tiket (
      kode TEXT PRIMARY KEY,
      kategori TEXT NOT NULL,
      jumlah INTEGER NOT NULL,
      total INTEGER NOT NULL,
      dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
      dipakai_pada TIMESTAMPTZ
    )
  `;
  // Kolom tambahan buat alur "pesan dulu, di-approve petugas baru aktif".
  // ADD COLUMN IF NOT EXISTS aman dipanggil berkali-kali & gak ganggu data lama —
  // tiket lama otomatis dianggap 'disetujui' (default) biar tetap valid kayak sebelumnya.
  await sql`ALTER TABLE tiket ADD COLUMN IF NOT EXISTS metode TEXT NOT NULL DEFAULT 'cash'`;
  await sql`ALTER TABLE tiket ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'disetujui'`;
  await sql`ALTER TABLE tiket ADD COLUMN IF NOT EXISTS bukti_tf TEXT`;
  await sql`ALTER TABLE tiket ADD COLUMN IF NOT EXISTS nama_pembeli TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE tiket ADD COLUMN IF NOT EXISTS wa_nomor TEXT NOT NULL DEFAULT ''`;
  await sql`
    CREATE TABLE IF NOT EXISTS produk (
      kode TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      harga INTEGER NOT NULL,
      stok INTEGER NOT NULL,
      dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS penjualan_warung (
      kode TEXT PRIMARY KEY,
      item JSONB NOT NULL,
      total INTEGER NOT NULL,
      metode TEXT NOT NULL DEFAULT 'cash',
      waktu TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS pengaturan (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS karyawan (
      kode TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      pin TEXT NOT NULL UNIQUE,
      gaji_harian INTEGER NOT NULL DEFAULT 0,
      aktif BOOLEAN NOT NULL DEFAULT true,
      dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS username TEXT UNIQUE`;
  await sql`
    CREATE TABLE IF NOT EXISTS absensi (
      kode TEXT PRIMARY KEY,
      karyawan_kode TEXT NOT NULL REFERENCES karyawan(kode) ON DELETE CASCADE,
      masuk TIMESTAMPTZ NOT NULL DEFAULT now(),
      keluar TIMESTAMPTZ
    )
  `;
  await sql`ALTER TABLE absensi ADD COLUMN IF NOT EXISTS foto_masuk TEXT`;
  await sql`ALTER TABLE absensi ADD COLUMN IF NOT EXISTS foto_keluar TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS pengeluaran (
      kode TEXT PRIMARY KEY,
      keterangan TEXT NOT NULL,
      jumlah INTEGER NOT NULL,
      dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  sudahSiap = true;
}
