import { createServerFn } from "@tanstack/react-start";
import { MODE_DEMO, pastikanSkema, sql } from "./db";
import {
  HARGA,
  kodeAcak,
  type HasilScan,
  type Kategori,
  type MetodeBayarTiket,
  type StatusTiket,
  type Tiket,
} from "./tickets";

type BarisTiket = {
  kode: string;
  kategori: Kategori;
  jumlah: number;
  total: number;
  metode: MetodeBayarTiket;
  status: StatusTiket;
  bukti_tf: string | null;
  nama_pembeli: string;
  wa_nomor: string;
  dibuat_pada: string;
  dipakai_pada: string | null;
};

function barisKeTiket(r: BarisTiket): Tiket {
  return {
    kode: r.kode,
    kategori: r.kategori,
    jumlah: r.jumlah,
    total: r.total,
    metode: r.metode,
    status: r.status,
    buktiTf: r.bukti_tf,
    namaPembeli: r.nama_pembeli,
    waNomor: r.wa_nomor,
    dibuatPada: new Date(r.dibuat_pada).toISOString(),
    dipakaiPada: r.dipakai_pada ? new Date(r.dipakai_pada).toISOString() : null,
  };
}

// Dipakai kalau DATABASE_URL belum diset (lihat db.ts) — data hidup di memori
// server aja, buat keperluan lihat-lihat tampilan lokal tanpa setup database.
const tiketDemo: Tiket[] = [];

// Ambil semua tiket, terbaru duluan. Dipanggil oleh useTiketList lewat react-query.
export const ambilSemuaTiket = createServerFn({ method: "GET" }).handler(async (): Promise<Tiket[]> => {
  if (MODE_DEMO) return [...tiketDemo];

  await pastikanSkema();
  const rows = (await sql`
    SELECT * FROM tiket ORDER BY dibuat_pada DESC
  `) as BarisTiket[];
  return rows.map(barisKeTiket);
});

// Bikin PESANAN tiket baru (belum aktif) — status selalu 'menunggu' sampai
// petugas approve (cash: konfirmasi uang diterima, qris: cek bukti transfer).
export const buatTiketServer = createServerFn({ method: "POST" })
  .validator(
    (data: {
      kategori: Kategori;
      jumlah: number;
      metode: MetodeBayarTiket;
      buktiTf?: string | null;
      namaPembeli: string;
      waNomor: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<Tiket> => {
    const total = HARGA[data.kategori] * data.jumlah;
    const buktiTf = data.buktiTf ?? null;

    if (MODE_DEMO) {
      const tiket: Tiket = {
        kode: kodeAcak(),
        kategori: data.kategori,
        jumlah: data.jumlah,
        total,
        metode: data.metode,
        status: "menunggu",
        buktiTf,
        namaPembeli: data.namaPembeli,
        waNomor: data.waNomor,
        dibuatPada: new Date().toISOString(),
        dipakaiPada: null,
      };
      tiketDemo.unshift(tiket);
      return tiket;
    }

    await pastikanSkema();
    // Coba beberapa kali kalau (sangat jarang) kode acaknya bentrok.
    for (let percobaan = 0; percobaan < 5; percobaan++) {
      const kode = kodeAcak();
      try {
        const rows = (await sql`
          INSERT INTO tiket (kode, kategori, jumlah, total, metode, status, bukti_tf, nama_pembeli, wa_nomor)
          VALUES (${kode}, ${data.kategori}, ${data.jumlah}, ${total}, ${data.metode}, 'menunggu', ${buktiTf}, ${data.namaPembeli}, ${data.waNomor})
          RETURNING *
        `) as BarisTiket[];
        return barisKeTiket(rows[0]!);
      } catch (err: any) {
        if (err?.code === "23505") continue; // kode sudah dipakai, coba lagi
        throw err;
      }
    }
    throw new Error("Gagal membuat kode tiket unik, coba lagi.");
  });

// Ambil pesanan yang masih menunggu approval petugas.
export const ambilTiketMenunggu = createServerFn({ method: "GET" }).handler(async (): Promise<Tiket[]> => {
  if (MODE_DEMO) return tiketDemo.filter((t) => t.status === "menunggu");

  await pastikanSkema();
  const rows = (await sql`
    SELECT * FROM tiket WHERE status = 'menunggu' ORDER BY dibuat_pada ASC
  `) as BarisTiket[];
  return rows.map(barisKeTiket);
});

// Petugas menyetujui pesanan (uang cash sudah diterima / bukti transfer QRIS sudah dicek).
export const setujuiTiket = createServerFn({ method: "POST" })
  .validator((kode: string) => kode)
  .handler(async ({ data: kode }): Promise<Tiket> => {
    if (MODE_DEMO) {
      const idx = tiketDemo.findIndex((t) => t.kode === kode);
      if (idx === -1) throw new Error("Pesanan tidak ditemukan");
      tiketDemo[idx] = { ...tiketDemo[idx]!, status: "disetujui" };
      return tiketDemo[idx]!;
    }

    await pastikanSkema();
    const rows = (await sql`
      UPDATE tiket SET status = 'disetujui' WHERE kode = ${kode} RETURNING *
    `) as BarisTiket[];
    if (rows.length === 0) throw new Error("Pesanan tidak ditemukan");
    return barisKeTiket(rows[0]!);
  });

// Petugas menolak pesanan (misal bukti transfer gak jelas / gak ada yang bayar cash).
export const tolakTiket = createServerFn({ method: "POST" })
  .validator((kode: string) => kode)
  .handler(async ({ data: kode }): Promise<Tiket> => {
    if (MODE_DEMO) {
      const idx = tiketDemo.findIndex((t) => t.kode === kode);
      if (idx === -1) throw new Error("Pesanan tidak ditemukan");
      tiketDemo[idx] = { ...tiketDemo[idx]!, status: "ditolak" };
      return tiketDemo[idx]!;
    }

    await pastikanSkema();
    const rows = (await sql`
      UPDATE tiket SET status = 'ditolak' WHERE kode = ${kode} RETURNING *
    `) as BarisTiket[];
    if (rows.length === 0) throw new Error("Pesanan tidak ditemukan");
    return barisKeTiket(rows[0]!);
  });

// Cek status 1 pesanan tiket by kode — dipakai di halaman kasir buat polling
// (nunggu petugas approve) tanpa perlu refresh manual.
export const cekStatusTiket = createServerFn({ method: "GET" })
  .validator((kode: string) => kode)
  .handler(async ({ data: kode }): Promise<Tiket | null> => {
    if (MODE_DEMO) return tiketDemo.find((t) => t.kode === kode) ?? null;

    await pastikanSkema();
    const rows = (await sql`SELECT * FROM tiket WHERE kode = ${kode}`) as BarisTiket[];
    return rows[0] ? barisKeTiket(rows[0]) : null;
  });

// Validasi tiket saat di-scan di pintu masuk. Kalau valid, disetujui, & belum
// dipakai, langsung ditandai "dipakai" dalam satu query (mencegah 1 tiket
// dipakai 2x walau di-scan hampir bersamaan dari 2 device).
export const validasiTiketServer = createServerFn({ method: "POST" })
  .validator((kodeMentah: string) => kodeMentah)
  .handler(async ({ data: kodeMentah }): Promise<HasilScan> => {
    const kode = kodeMentah.trim().toUpperCase();

    if (MODE_DEMO) {
      const idx = tiketDemo.findIndex((t) => t.kode === kode);
      if (idx === -1) return { status: "tidak-ditemukan", kode };
      const tiket = tiketDemo[idx]!;
      if (tiket.status === "menunggu") return { status: "belum-disetujui", tiket };
      if (tiket.status === "ditolak") return { status: "ditolak", tiket };
      if (tiket.dipakaiPada) return { status: "terpakai", tiket };
      const dipakai: Tiket = { ...tiket, dipakaiPada: new Date().toISOString() };
      tiketDemo[idx] = dipakai;
      return { status: "valid", tiket: dipakai };
    }

    await pastikanSkema();
    // Cuma tandai "dipakai" kalau statusnya udah disetujui & belum pernah dipakai.
    const ditandai = (await sql`
      UPDATE tiket
      SET dipakai_pada = now()
      WHERE kode = ${kode} AND status = 'disetujui' AND dipakai_pada IS NULL
      RETURNING *
    `) as BarisTiket[];
    if (ditandai.length > 0) {
      return { status: "valid", tiket: barisKeTiket(ditandai[0]!) };
    }

    const cek = (await sql`SELECT * FROM tiket WHERE kode = ${kode}`) as BarisTiket[];
    if (cek.length === 0) return { status: "tidak-ditemukan", kode };
    const tiket = barisKeTiket(cek[0]!);
    if (tiket.status === "menunggu") return { status: "belum-disetujui", tiket };
    if (tiket.status === "ditolak") return { status: "ditolak", tiket };
    return { status: "terpakai", tiket };
  });
