import { createServerFn } from "@tanstack/react-start";
import { MODE_DEMO, pastikanSkema, sql } from "./db";
import { HARGA, kodeAcak, type HasilScan, type Kategori, type Tiket } from "./tickets";

type BarisTiket = {
  kode: string;
  kategori: Kategori;
  jumlah: number;
  total: number;
  dibuat_pada: string;
  dipakai_pada: string | null;
};

function barisKeTiket(r: BarisTiket): Tiket {
  return {
    kode: r.kode,
    kategori: r.kategori,
    jumlah: r.jumlah,
    total: r.total,
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

// Bikin tiket baru: generate kode unik, simpan ke database.
export const buatTiketServer = createServerFn({ method: "POST" })
  .validator((data: { kategori: Kategori; jumlah: number }) => data)
  .handler(async ({ data }): Promise<Tiket> => {
    const total = HARGA[data.kategori] * data.jumlah;

    if (MODE_DEMO) {
      const tiket: Tiket = {
        kode: kodeAcak(),
        kategori: data.kategori,
        jumlah: data.jumlah,
        total,
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
          INSERT INTO tiket (kode, kategori, jumlah, total)
          VALUES (${kode}, ${data.kategori}, ${data.jumlah}, ${total})
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

// Validasi tiket saat di-scan di pintu masuk. Kalau valid & belum dipakai,
// langsung ditandai "dipakai" dalam satu query (mencegah 1 tiket dipakai 2x
// walau di-scan hampir bersamaan dari 2 device).
export const validasiTiketServer = createServerFn({ method: "POST" })
  .validator((kodeMentah: string) => kodeMentah)
  .handler(async ({ data: kodeMentah }): Promise<HasilScan> => {
    const kode = kodeMentah.trim().toUpperCase();

    if (MODE_DEMO) {
      const idx = tiketDemo.findIndex((t) => t.kode === kode);
      if (idx === -1) return { status: "tidak-ditemukan", kode };
      const tiket = tiketDemo[idx]!;
      if (tiket.dipakaiPada) return { status: "terpakai", tiket };
      const dipakai: Tiket = { ...tiket, dipakaiPada: new Date().toISOString() };
      tiketDemo[idx] = dipakai;
      return { status: "valid", tiket: dipakai };
    }

    await pastikanSkema();
    const ditandai = (await sql`
      UPDATE tiket
      SET dipakai_pada = now()
      WHERE kode = ${kode} AND dipakai_pada IS NULL
      RETURNING *
    `) as BarisTiket[];
    if (ditandai.length > 0) {
      return { status: "valid", tiket: barisKeTiket(ditandai[0]!) };
    }

    const cek = (await sql`SELECT * FROM tiket WHERE kode = ${kode}`) as BarisTiket[];
    if (cek.length === 0) return { status: "tidak-ditemukan", kode };
    return { status: "terpakai", tiket: barisKeTiket(cek[0]!) };
  });
