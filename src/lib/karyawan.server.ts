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
  keluar: string | null;
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
    keluar: r.keluar ? new Date(r.keluar).toISOString() : null,
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

// ---------- Absensi (dipakai karyawan lewat HP masing-masing) ----------

// Karyawan masukin PIN mereka. Kalau lagi gak ada sesi absen yang masih
// terbuka (belum absen keluar), sistem otomatis absen MASUK. Kalau ada,
// otomatis absen KELUAR. Jadi 1 tombol aja, gak perlu pilih menu.
export const absenDenganPin = createServerFn({ method: "POST" })
  .validator((pin: string) => pin)
  .handler(async ({ data: pin }): Promise<{ karyawan: Karyawan; aksi: "masuk" | "keluar" }> => {
    if (MODE_DEMO) {
      const k = karyawanDemo.find((k) => k.pin === pin && k.aktif);
      if (!k) throw new Error("PIN tidak dikenali");
      const sesiTerbuka = absensiDemo.find((a) => a.karyawanKode === k.kode && !a.keluar);
      if (sesiTerbuka) {
        sesiTerbuka.keluar = new Date().toISOString();
        return { karyawan: k, aksi: "keluar" };
      }
      absensiDemo.unshift({
        kode: buatKode("ABS"),
        karyawanKode: k.kode,
        masuk: new Date().toISOString(),
        keluar: null,
      });
      return { karyawan: k, aksi: "masuk" };
    }

    await pastikanSkema();
    const karyawanRows = (await sql`
      SELECT * FROM karyawan WHERE pin = ${pin} AND aktif = true
    `) as BarisKaryawan[];
    if (karyawanRows.length === 0) throw new Error("PIN tidak dikenali");
    const karyawan = barisKeKaryawan(karyawanRows[0]!);

    const terbuka = (await sql`
      SELECT * FROM absensi WHERE karyawan_kode = ${karyawan.kode} AND keluar IS NULL
      ORDER BY masuk DESC LIMIT 1
    `) as BarisAbsensi[];

    if (terbuka.length > 0) {
      await sql`UPDATE absensi SET keluar = now() WHERE kode = ${terbuka[0]!.kode}`;
      return { karyawan, aksi: "keluar" };
    }

    await sql`
      INSERT INTO absensi (kode, karyawan_kode) VALUES (${buatKode("ABS")}, ${karyawan.kode})
    `;
    return { karyawan, aksi: "masuk" };
  });

// Ambil semua riwayat absensi — dipakai manager buat rekap.
export const ambilAbsensi = createServerFn({ method: "GET" }).handler(async (): Promise<Absensi[]> => {
  if (MODE_DEMO) return [...absensiDemo];

  await pastikanSkema();
  const rows = (await sql`SELECT * FROM absensi ORDER BY masuk DESC`) as BarisAbsensi[];
  return rows.map(barisKeAbsensi);
});
