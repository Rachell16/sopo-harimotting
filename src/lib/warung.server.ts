import { createServerFn } from "@tanstack/react-start";
import { MODE_DEMO, pastikanSkema, sql } from "./db";
import { buatKode } from "./kode";
import type { ItemKeranjang, MetodeBayar, Penjualan, Produk } from "./warung";

type BarisProduk = {
  kode: string;
  nama: string;
  kategori: string;
  harga: number;
  stok: number;
  dibuat_pada: string;
};

type BarisPenjualan = {
  kode: string;
  item: ItemKeranjang[];
  total: number;
  metode: MetodeBayar;
  waktu: string;
};

function barisKeProduk(r: BarisProduk): Produk {
  return {
    kode: r.kode,
    nama: r.nama,
    kategori: r.kategori,
    harga: r.harga,
    stok: r.stok,
    dibuatPada: new Date(r.dibuat_pada).toISOString(),
  };
}

function barisKePenjualan(r: BarisPenjualan): Penjualan {
  return {
    kode: r.kode,
    item: r.item,
    total: r.total,
    metode: r.metode,
    waktu: new Date(r.waktu).toISOString(),
  };
}

// Dipakai kalau DATABASE_URL belum diset — data hidup di memori server aja,
// sama seperti mode demo di tickets.server.ts.
const produkDemo: Produk[] = [];
const penjualanDemo: Penjualan[] = [];
const kategoriDemo: string[] = [];

// ---------- Kategori produk ----------

// Gabungan kategori yang "resmi" dibikin (biar bisa ada kategori kosong dulu
// sebelum ada produknya) + kategori yang kepakai di produk (dari import lama).
export const ambilKategoriProduk = createServerFn({ method: "GET" }).handler(async (): Promise<string[]> => {
  if (MODE_DEMO) {
    const dariProduk = produkDemo.map((p) => p.kategori);
    return Array.from(new Set([...kategoriDemo, ...dariProduk])).sort();
  }

  await pastikanSkema();
  const rows = (await sql`
    SELECT nama FROM kategori_produk
    UNION
    SELECT DISTINCT kategori AS nama FROM produk
    ORDER BY nama ASC
  `) as { nama: string }[];
  return rows.map((r) => r.nama);
});

export const tambahKategoriProduk = createServerFn({ method: "POST" })
  .validator((nama: string) => nama)
  .handler(async ({ data: nama }): Promise<{ ok: true }> => {
    const bersih = nama.trim();
    if (!bersih) throw new Error("Nama kategori gak boleh kosong");

    if (MODE_DEMO) {
      if (!kategoriDemo.includes(bersih)) kategoriDemo.push(bersih);
      return { ok: true };
    }

    await pastikanSkema();
    await sql`INSERT INTO kategori_produk (nama) VALUES (${bersih}) ON CONFLICT (nama) DO NOTHING`;
    return { ok: true };
  });

export const hapusKategoriProduk = createServerFn({ method: "POST" })
  .validator((nama: string) => nama)
  .handler(async ({ data: nama }): Promise<{ ok: true }> => {
    if (MODE_DEMO) {
      const idx = kategoriDemo.indexOf(nama);
      if (idx !== -1) kategoriDemo.splice(idx, 1);
      return { ok: true };
    }

    await pastikanSkema();
    await sql`DELETE FROM kategori_produk WHERE nama = ${nama}`;
    return { ok: true };
  });

// ---------- Produk (stok) ----------

export const ambilProduk = createServerFn({ method: "GET" }).handler(async (): Promise<Produk[]> => {
  if (MODE_DEMO) return [...produkDemo].sort((a, b) => a.nama.localeCompare(b.nama));

  await pastikanSkema();
  const rows = (await sql`SELECT * FROM produk ORDER BY nama ASC`) as BarisProduk[];
  return rows.map(barisKeProduk);
});

export const buatProduk = createServerFn({ method: "POST" })
  .validator((data: { nama: string; kategori: string; harga: number; stok: number }) => data)
  .handler(async ({ data }): Promise<Produk> => {
    const kategori = data.kategori.trim() || "Lainnya";

    if (MODE_DEMO) {
      const produk: Produk = {
        kode: buatKode("PRD"),
        nama: data.nama,
        kategori,
        harga: data.harga,
        stok: data.stok,
        dibuatPada: new Date().toISOString(),
      };
      produkDemo.push(produk);
      return produk;
    }

    await pastikanSkema();
    for (let percobaan = 0; percobaan < 5; percobaan++) {
      const kode = buatKode("PRD");
      try {
        const rows = (await sql`
          INSERT INTO produk (kode, nama, kategori, harga, stok)
          VALUES (${kode}, ${data.nama}, ${kategori}, ${data.harga}, ${data.stok})
          RETURNING *
        `) as BarisProduk[];
        await sql`INSERT INTO kategori_produk (nama) VALUES (${kategori}) ON CONFLICT (nama) DO NOTHING`;
        return barisKeProduk(rows[0]!);
      } catch (err: any) {
        if (err?.code === "23505") continue;
        throw err;
      }
    }
    throw new Error("Gagal membuat kode produk unik, coba lagi.");
  });

export const updateProduk = createServerFn({ method: "POST" })
  .validator((data: { kode: string; nama: string; kategori: string; harga: number; stok: number }) => data)
  .handler(async ({ data }): Promise<Produk> => {
    const kategori = data.kategori.trim() || "Lainnya";

    if (MODE_DEMO) {
      const idx = produkDemo.findIndex((p) => p.kode === data.kode);
      if (idx === -1) throw new Error("Produk tidak ditemukan");
      produkDemo[idx] = { ...produkDemo[idx]!, nama: data.nama, kategori, harga: data.harga, stok: data.stok };
      return produkDemo[idx]!;
    }

    await pastikanSkema();
    const rows = (await sql`
      UPDATE produk SET nama = ${data.nama}, kategori = ${kategori}, harga = ${data.harga}, stok = ${data.stok}
      WHERE kode = ${data.kode}
      RETURNING *
    `) as BarisProduk[];
    if (rows.length === 0) throw new Error("Produk tidak ditemukan");
    return barisKeProduk(rows[0]!);
  });

export const hapusProduk = createServerFn({ method: "POST" })
  .validator((kode: string) => kode)
  .handler(async ({ data: kode }): Promise<{ ok: true }> => {
    if (MODE_DEMO) {
      const idx = produkDemo.findIndex((p) => p.kode === kode);
      if (idx !== -1) produkDemo.splice(idx, 1);
      return { ok: true };
    }

    await pastikanSkema();
    await sql`DELETE FROM produk WHERE kode = ${kode}`;
    return { ok: true };
  });

// Import banyak produk sekaligus dari Excel/CSV — dipakai tombol "Import Excel"
// di halaman Stok. Produk baru ditambahkan, gak menimpa yang udah ada.
export const importProdukMassal = createServerFn({ method: "POST" })
  .validator((items: { nama: string; kategori: string; harga: number; stok: number }[]) => items)
  .handler(async ({ data: items }): Promise<{ jumlah: number }> => {
    const valid = items.filter((i) => i.nama.trim().length > 0);

    if (MODE_DEMO) {
      for (const item of valid) {
        produkDemo.push({
          kode: buatKode("PRD"),
          nama: item.nama.trim(),
          kategori: item.kategori.trim() || "Lainnya",
          harga: item.harga || 0,
          stok: item.stok || 0,
          dibuatPada: new Date().toISOString(),
        });
      }
      return { jumlah: valid.length };
    }

    await pastikanSkema();
    for (const item of valid) {
      for (let percobaan = 0; percobaan < 5; percobaan++) {
        const kode = buatKode("PRD");
        try {
          await sql`
            INSERT INTO produk (kode, nama, kategori, harga, stok)
            VALUES (${kode}, ${item.nama.trim()}, ${item.kategori.trim() || "Lainnya"}, ${item.harga || 0}, ${item.stok || 0})
          `;
          break;
        } catch (err: any) {
          if (err?.code === "23505") continue;
          throw err;
        }
      }
    }
    return { jumlah: valid.length };
  });

// ---------- Penjualan (kasir jajanan) ----------

// Proses satu transaksi: cek stok cukup, kurangi stok tiap produk, catat penjualan.
// Semua-atau-tidak-sama-sekali — kalau ada 1 produk stoknya kurang, seluruh transaksi dibatalkan.
export const prosesPenjualan = createServerFn({ method: "POST" })
  .validator((data: { keranjang: ItemKeranjang[]; metode: MetodeBayar }) => data)
  .handler(async ({ data: { keranjang, metode } }): Promise<Penjualan> => {
    if (keranjang.length === 0) throw new Error("Keranjang kosong");
    const total = keranjang.reduce((a, i) => a + i.harga * i.qty, 0);

    if (MODE_DEMO) {
      for (const item of keranjang) {
        const p = produkDemo.find((p) => p.kode === item.kode);
        if (!p || p.stok < item.qty) throw new Error(`Stok ${item.nama} tidak cukup`);
      }
      for (const item of keranjang) {
        const p = produkDemo.find((p) => p.kode === item.kode)!;
        p.stok -= item.qty;
      }
      const penjualan: Penjualan = {
        kode: buatKode("JJN"),
        item: keranjang,
        total,
        metode,
        waktu: new Date().toISOString(),
      };
      penjualanDemo.unshift(penjualan);
      return penjualan;
    }

    await pastikanSkema();

    // Cek semua stok dulu sebelum ngurangin apa pun — biar gak ada transaksi
    // yang "kepotong separuh" kalau salah satu produk stoknya kurang.
    const kodeList = keranjang.map((i) => i.kode);
    const stokSekarang = (await sql`
      SELECT kode, stok FROM produk WHERE kode = ANY(${kodeList})
    `) as { kode: string; stok: number }[];

    for (const item of keranjang) {
      const p = stokSekarang.find((p) => p.kode === item.kode);
      if (!p || p.stok < item.qty) {
        throw new Error(`Stok ${item.nama} tidak cukup`);
      }
    }

    for (const item of keranjang) {
      await sql`UPDATE produk SET stok = stok - ${item.qty} WHERE kode = ${item.kode}`;
    }

    const kode = buatKode("JJN");
    const rows = (await sql`
      INSERT INTO penjualan_warung (kode, item, total, metode)
      VALUES (${kode}, ${JSON.stringify(keranjang)}::jsonb, ${total}, ${metode})
      RETURNING *
    `) as BarisPenjualan[];
    return barisKePenjualan(rows[0]!);
  });

// Ambil riwayat penjualan warung, terbaru duluan — dipakai di halaman Laporan.
export const ambilPenjualan = createServerFn({ method: "GET" }).handler(async (): Promise<Penjualan[]> => {
  if (MODE_DEMO) return [...penjualanDemo];

  await pastikanSkema();
  const rows = (await sql`SELECT * FROM penjualan_warung ORDER BY waktu DESC`) as BarisPenjualan[];
  return rows.map(barisKePenjualan);
});
