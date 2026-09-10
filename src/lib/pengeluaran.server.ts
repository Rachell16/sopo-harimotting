import { createServerFn } from "@tanstack/react-start";
import { MODE_DEMO, pastikanSkema, sql } from "./db";
import { buatKode } from "./kode";
import type { Pengeluaran } from "./karyawan";

type BarisPengeluaran = {
  kode: string;
  keterangan: string;
  jumlah: number;
  dibuat_pada: string;
};

function barisKePengeluaran(r: BarisPengeluaran): Pengeluaran {
  return {
    kode: r.kode,
    keterangan: r.keterangan,
    jumlah: r.jumlah,
    dibuatPada: new Date(r.dibuat_pada).toISOString(),
  };
}

const pengeluaranDemo: Pengeluaran[] = [];

export const ambilPengeluaran = createServerFn({ method: "GET" }).handler(async (): Promise<Pengeluaran[]> => {
  if (MODE_DEMO) return [...pengeluaranDemo];

  await pastikanSkema();
  const rows = (await sql`SELECT * FROM pengeluaran ORDER BY dibuat_pada DESC`) as BarisPengeluaran[];
  return rows.map(barisKePengeluaran);
});

export const tambahPengeluaran = createServerFn({ method: "POST" })
  .validator((data: { keterangan: string; jumlah: number }) => data)
  .handler(async ({ data }): Promise<Pengeluaran> => {
    if (MODE_DEMO) {
      const p: Pengeluaran = {
        kode: buatKode("EXP"),
        keterangan: data.keterangan,
        jumlah: data.jumlah,
        dibuatPada: new Date().toISOString(),
      };
      pengeluaranDemo.unshift(p);
      return p;
    }

    await pastikanSkema();
    const rows = (await sql`
      INSERT INTO pengeluaran (kode, keterangan, jumlah)
      VALUES (${buatKode("EXP")}, ${data.keterangan}, ${data.jumlah})
      RETURNING *
    `) as BarisPengeluaran[];
    return barisKePengeluaran(rows[0]!);
  });

export const hapusPengeluaran = createServerFn({ method: "POST" })
  .validator((kode: string) => kode)
  .handler(async ({ data: kode }): Promise<{ ok: true }> => {
    if (MODE_DEMO) {
      const idx = pengeluaranDemo.findIndex((p) => p.kode === kode);
      if (idx !== -1) pengeluaranDemo.splice(idx, 1);
      return { ok: true };
    }

    await pastikanSkema();
    await sql`DELETE FROM pengeluaran WHERE kode = ${kode}`;
    return { ok: true };
  });
