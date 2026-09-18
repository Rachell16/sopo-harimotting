import type { Tiket } from "./tickets";
import type { Penjualan, Produk } from "./warung";

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
// Ditampilkan mulai Senin biar enak dibaca (kalender orang Indonesia biasanya gitu).
const URUTAN_TAMPIL = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export type KunjunganHari = { hari: string; jumlah: number; pendapatan: number };

// Total pengunjung (jumlah tiket disetujui) & pendapatan, dikelompokkan per
// hari-dalam-minggu (Senin s/d Minggu) — buat lihat pola "hari mana paling ramai".
export function kunjunganPerHariMinggu(tiketList: Tiket[]): KunjunganHari[] {
  const map = new Map<string, { jumlah: number; pendapatan: number }>();
  for (const nama of URUTAN_TAMPIL) map.set(nama, { jumlah: 0, pendapatan: 0 });

  for (const t of tiketList) {
    const hari = NAMA_HARI[new Date(t.dibuatPada).getDay()]!;
    const cur = map.get(hari)!;
    cur.jumlah += t.jumlah;
    cur.pendapatan += t.total;
  }

  return URUTAN_TAMPIL.map((hari) => ({ hari, ...map.get(hari)! }));
}

export type ProdukTerlaris = { nama: string; qty: number; total: number };

// Jumlahin qty & pendapatan tiap produk dari semua transaksi jajanan, ambil
// yang paling banyak kejual.
export function produkTerlaris(jajananList: Penjualan[], topN = 5): ProdukTerlaris[] {
  const map = new Map<string, ProdukTerlaris>();
  for (const p of jajananList) {
    for (const item of p.item) {
      const cur = map.get(item.nama) ?? { nama: item.nama, qty: 0, total: 0 };
      cur.qty += item.qty;
      cur.total += item.harga * item.qty;
      map.set(item.nama, cur);
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, topN);
}

export type BreakdownKategori = { kategori: "dewasa" | "anak"; jumlah: number; pendapatan: number };

export function breakdownKategoriTiket(tiketList: Tiket[]): BreakdownKategori[] {
  const kategori: BreakdownKategori[] = [
    { kategori: "dewasa", jumlah: 0, pendapatan: 0 },
    { kategori: "anak", jumlah: 0, pendapatan: 0 },
  ];
  for (const t of tiketList) {
    const baris = kategori.find((k) => k.kategori === t.kategori)!;
    baris.jumlah += t.jumlah;
    baris.pendapatan += t.total;
  }
  return kategori;
}

// Produk yang stoknya udah tipis (di bawah batas), diurutkan dari paling tipis.
export function stokMenipis(produkList: Produk[], batas = 5): Produk[] {
  return produkList.filter((p) => p.stok <= batas).sort((a, b) => a.stok - b.stok);
}

// Rekomendasi bisnis GRATIS — dihitung dari data langsung (bukan panggil AI
// berbayar), tapi tetap kasih insight yang aktual & bisa langsung ditindaklanjuti.
export function buatRekomendasiLokal(input: {
  kunjunganHari: KunjunganHari[];
  terlaris: ProdukTerlaris[];
  menipis: Produk[];
  labaRugi: number;
  totalPendapatan: number;
}): string[] {
  const { kunjunganHari, terlaris, menipis, labaRugi, totalPendapatan } = input;
  const poin: string[] = [];

  // Hari ramai vs sepi
  const adaData = kunjunganHari.some((h) => h.jumlah > 0);
  if (adaData) {
    const terurut = [...kunjunganHari].sort((a, b) => b.jumlah - a.jumlah);
    const ramai = terurut[0]!;
    const sepi = terurut[terurut.length - 1]!;
    if (ramai.jumlah > 0) {
      poin.push(
        `${ramai.hari} adalah hari paling ramai (${ramai.jumlah} pengunjung) — pastikan petugas & stok jajanan siap lebih banyak di hari itu.`,
      );
    }
    if (sepi.jumlah === 0 && ramai.jumlah > 0) {
      poin.push(`${sepi.hari} masih sepi pengunjung — coba promo khusus atau diskon di hari itu buat narik pengunjung.`);
    }
  } else {
    poin.push("Belum cukup data kunjungan buat lihat pola hari ramai/sepi — cek lagi setelah beberapa minggu.");
  }

  // Stok menipis
  if (menipis.length > 0) {
    const habis = menipis.filter((p) => p.stok === 0);
    if (habis.length > 0) {
      poin.push(
        `${habis.length} produk udah HABIS total (${habis.map((p) => p.nama).slice(0, 3).join(", ")}${habis.length > 3 ? ", dll" : ""}) — restock secepatnya biar gak kehilangan penjualan.`,
      );
    }
    const hampirHabis = menipis.filter((p) => p.stok > 0);
    if (hampirHabis.length > 0) {
      poin.push(
        `${hampirHabis.length} produk stoknya tinggal dikit (${hampirHabis.map((p) => `${p.nama} sisa ${p.stok}`).slice(0, 3).join(", ")}) — siapin restock minggu ini.`,
      );
    }
  } else {
    poin.push("Semua stok masih aman, gak ada yang perlu buru-buru di-restock 👍");
  }

  // Produk terlaris
  if (terlaris.length > 0) {
    const top = terlaris[0]!;
    poin.push(
      `"${top.nama}" produk paling laris (${top.qty} terjual) — pertimbangkan bikin paket bundling atau taruh di posisi paling depan warung biar makin gampang dilihat pembeli.`,
    );
  }

  // Laba rugi
  if (totalPendapatan > 0) {
    if (labaRugi < 0) {
      poin.push("Lagi rugi di periode ini — cek lagi pengeluaran gaji & operasional, mungkin ada yang bisa dihemat.");
    } else if (labaRugi > 0) {
      poin.push(`Untung ${Math.round(labaRugi / 1000)}rb di periode ini — bagus buat disisihkan jadi dana restock atau perawatan fasilitas.`);
    }
  }

  return poin.slice(0, 6);
}
