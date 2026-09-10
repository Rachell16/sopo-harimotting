import { createServerFn } from "@tanstack/react-start";
import { MODE_DEMO, pastikanSkema, sql } from "./db";
import { buatKode } from "./kode";
import type { Absensi, Karyawan } from "./karyawan";

type BarisKaryawan = {
  kode: string;
  nama: string;
  pin: string;
  gaji_harian: number;
  aktif: boolean;
  dibuat_pada: string;
};

type BarisAbsensi = {
  kode: string;
  karyawan_kode: string;
  masuk: string;
  foto_masuk: string | null;
  keluar: string | null;
  foto_keluar: string | null;
};

function barisKeKaryawan(r: BarisKaryawan): Karyawan {
  return {
    kode: r.kode,
    nama: r.nama,
    pin: r.pin,
    gajiHarian: r.gaji_harian,
    aktif: r.aktif,
    dibuatPada: new Date(r.dibuat_pada).toISOString(),
  };
}

function barisKeAbsensi(r: BarisAbsensi): Absensi {
  return {
    kode: r.kode,
    karyawanKode: r.karyawan_kode,
    masuk: new Date(r.masuk).toISOString(),
    fotoMasuk: r.foto_masuk,
    keluar: r.keluar ? new Date(r.keluar).toISOString() : null,
    fotoKeluar: r.foto_keluar,
  };
}

// Dipakai kalau DATABASE_URL belum diset.
const karyawanDemo: Karyawan[] = [];
const absensiDemo: Absensi[] = [];

// ---------- Karyawan (dikelola manager) ----------

export const ambilKaryawan = createServerFn({ method: "GET" }).handler(async (): Promise<Karyawan[]> => {
  if (MODE_DEMO) return [...karyawanDemo].sort((a, b) => a.nama.localeCompare(b.nama));

  await pastikanSkema();
  const rows = (await sql`SELECT * FROM karyawan ORDER BY nama ASC`) as BarisKaryawan[];
  return rows.map(barisKeKaryawan);
});

export const buatKaryawan = createServerFn({ method: "POST" })
  .validator((data: { nama: string; pin: string; gajiHarian: number }) => data)
  .handler(async ({ data }): Promise<Karyawan> => {
    if (MODE_DEMO) {
      if (karyawanDemo.some((k) => k.pin === data.pin)) throw new Error("PIN sudah dipakai karyawan lain");
      const k: Karyawan = {
        kode: buatKode("KRY"),
        nama: data.nama,
        pin: data.pin,
        gajiHarian: data.gajiHarian,
        aktif: true,
        dibuatPada: new Date().toISOString(),
      };
      karyawanDemo.push(k);
      return k;
    }

    await pastikanSkema();
    for (let percobaan = 0; percobaan < 5; percobaan++) {
      const kode = buatKode("KRY");
      try {
        const rows = (await sql`
          INSERT INTO karyawan (kode, nama, pin, gaji_harian)
          VALUES (${kode}, ${data.nama}, ${data.pin}, ${data.gajiHarian})
          RETURNING *
        `) as BarisKaryawan[];
        return barisKeKaryawan(rows[0]!);
      } catch (err: any) {
        if (err?.code === "23505" && err?.constraint?.includes("pkey")) continue; // kode bentrok, coba lagi
        if (err?.code === "23505") throw new Error("PIN sudah dipakai karyawan lain");
        throw err;
      }
    }
    throw new Error("Gagal membuat kode karyawan unik, coba lagi.");
  });

export const updateKaryawan = createServerFn({ method: "POST" })
  .validator((data: { kode: string; nama: string; pin: string; gajiHarian: number; aktif: boolean }) => data)
  .handler(async ({ data }): Promise<Karyawan> => {
    if (MODE_DEMO) {
      const idx = karyawanDemo.findIndex((k) => k.kode === data.kode);
      if (idx === -1) throw new Error("Karyawan tidak ditemukan");
      karyawanDemo[idx] = {
        ...karyawanDemo[idx]!,
        nama: data.nama,
        pin: data.pin,
        gajiHarian: data.gajiHarian,
        aktif: data.aktif,
      };
      return karyawanDemo[idx]!;
    }

    await pastikanSkema();
    try {
      const rows = (await sql`
        UPDATE karyawan
        SET nama = ${data.nama}, pin = ${data.pin}, gaji_harian = ${data.gajiHarian}, aktif = ${data.aktif}
        WHERE kode = ${data.kode}
        RETURNING *
      `) as BarisKaryawan[];
      if (rows.length === 0) throw new Error("Karyawan tidak ditemukan");
      return barisKeKaryawan(rows[0]!);
    } catch (err: any) {
      if (err?.code === "23505") throw new Error("PIN sudah dipakai karyawan lain");
      throw err;
    }
  });

export const hapusKaryawan = createServerFn({ method: "POST" })
  .validator((kode: string) => kode)
  .handler(async ({ data: kode }): Promise<{ ok: true }> => {
    if (MODE_DEMO) {
      const idx = karyawanDemo.findIndex((k) => k.kode === kode);
      if (idx !== -1) karyawanDemo.splice(idx, 1);
      return { ok: true };
    }

    await pastikanSkema();
    await sql`DELETE FROM karyawan WHERE kode = ${kode}`;
    return { ok: true };
  });

// ---------- Absensi (dipakai karyawan lewat dashboard pribadi masing-masing) ----------

// Langkah 1: karyawan login pakai PIN. Kalau cocok, kembalikan datanya (buat
// disimpan di sessionStorage sebagai sesi) — belum melakukan absen apa pun.
export const loginKaryawan = createServerFn({ method: "POST" })
  .validator((pin: string) => pin)
  .handler(async ({ data: pin }): Promise<Karyawan> => {
    if (MODE_DEMO) {
      const k = karyawanDemo.find((k) => k.pin === pin && k.aktif);
      if (!k) throw new Error("PIN tidak dikenali");
      return k;
    }

    await pastikanSkema();
    const rows = (await sql`
      SELECT * FROM karyawan WHERE pin = ${pin} AND aktif = true
    `) as BarisKaryawan[];
    if (rows.length === 0) throw new Error("PIN tidak dikenali");
    return barisKeKaryawan(rows[0]!);
  });

// Langkah 2: dari dashboard pribadi (udah login), karyawan absen pakai kode
// mereka sendiri (bukan PIN lagi) + foto. Otomatis MASUK kalau belum ada sesi
// terbuka, atau KELUAR kalau ada.
export const absenDenganKode = createServerFn({ method: "POST" })
  .validator((data: { kode: string; foto: string }) => data)
  .handler(async ({ data: { kode, foto } }): Promise<{ aksi: "masuk" | "keluar" }> => {
    if (MODE_DEMO) {
      const sesiTerbuka = absensiDemo.find((a) => a.karyawanKode === kode && !a.keluar);
      if (sesiTerbuka) {
        sesiTerbuka.keluar = new Date().toISOString();
        sesiTerbuka.fotoKeluar = foto;
        return { aksi: "keluar" };
      }
      absensiDemo.unshift({
        kode: buatKode("ABS"),
        karyawanKode: kode,
        masuk: new Date().toISOString(),
        fotoMasuk: foto,
        keluar: null,
        fotoKeluar: null,
      });
      return { aksi: "masuk" };
    }

    await pastikanSkema();
    const terbuka = (await sql`
      SELECT * FROM absensi WHERE karyawan_kode = ${kode} AND keluar IS NULL
      ORDER BY masuk DESC LIMIT 1
    `) as BarisAbsensi[];

    if (terbuka.length > 0) {
      await sql`UPDATE absensi SET keluar = now(), foto_keluar = ${foto} WHERE kode = ${terbuka[0]!.kode}`;
      return { aksi: "keluar" };
    }

    await sql`
      INSERT INTO absensi (kode, karyawan_kode, foto_masuk) VALUES (${buatKode("ABS")}, ${kode}, ${foto})
    `;
    return { aksi: "masuk" };
  });

// Ambil semua riwayat absensi — dipakai manager buat rekap semua karyawan.
export const ambilAbsensi = createServerFn({ method: "GET" }).handler(async (): Promise<Absensi[]> => {
  if (MODE_DEMO) return [...absensiDemo];

  await pastikanSkema();
  const rows = (await sql`SELECT * FROM absensi ORDER BY masuk DESC`) as BarisAbsensi[];
  return rows.map(barisKeAbsensi);
});

// Ambil riwayat absensi 1 karyawan aja — dipakai di dashboard pribadi mereka
// (gak perlu ngirim data karyawan lain ke HP mereka).
export const ambilAbsensiKaryawan = createServerFn({ method: "GET" })
  .validator((kode: string) => kode)
  .handler(async ({ data: kode }): Promise<Absensi[]> => {
    if (MODE_DEMO) return absensiDemo.filter((a) => a.karyawanKode === kode);

    await pastikanSkema();
    const rows = (await sql`
      SELECT * FROM absensi WHERE karyawan_kode = ${kode} ORDER BY masuk DESC
    `) as BarisAbsensi[];
    return rows.map(barisKeAbsensi);
  });
