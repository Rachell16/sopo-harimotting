export type Kategori = "dewasa" | "anak";
export type MetodeBayarTiket = "cash" | "qris";
export type StatusTiket = "menunggu" | "disetujui" | "ditolak";

export const HARGA: Record<Kategori, number> = {
  dewasa: 5000,
  anak: 5000,
};

export const LABEL: Record<Kategori, string> = {
  dewasa: "Dewasa",
  anak: "Anak",
};

export type Tiket = {
  kode: string;
  kategori: Kategori;
  jumlah: number;
  total: number;
  metode: MetodeBayarTiket;
  status: StatusTiket;
  buktiTf: string | null; // data URL base64, cuma diisi kalau metode = qris
  dibuatPada: string; // ISO
  dipakaiPada: string | null;
};

import { buatKode } from "./kode";

// Kode acak dipakai di client (optimistic UI) maupun server (lib/tickets.server.ts)
export function kodeAcak() {
  return buatKode("WST");
}

export type HasilScan =
  | { status: "valid"; tiket: Tiket }
  | { status: "terpakai"; tiket: Tiket }
  | { status: "belum-disetujui"; tiket: Tiket }
  | { status: "ditolak"; tiket: Tiket }
  | { status: "tidak-ditemukan"; kode: string };

// Catatan: penyimpanan data (buat tiket, validasi tiket, ambil semua tiket)
// sekarang ada di lib/tickets.server.ts — query ke database Postgres,
// bukan lagi localStorage, supaya data sinkron di semua device (kasir & pintu masuk).

export function hariIni(list: Tiket[]) {
  const h = new Date().toDateString();
  return list.filter((t) => new Date(t.dibuatPada).toDateString() === h);
}

export function pengunjungMasukHariIni(list: Tiket[]) {
  const h = new Date().toDateString();
  return list
    .filter((t) => t.dipakaiPada && new Date(t.dipakaiPada).toDateString() === h)
    .reduce((a, t) => a + t.jumlah, 0);
}

export function rupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function jam(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function tanggalJam(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

import { kelompokkanPerTanggal } from "./tanggal";

export type KelompokTanggal = {
  kunci: string; // YYYY-MM-DD, dipakai buat key React & urutan
  label: string; // "Hari ini" / "Kemarin" / "Senin, 8 September 2026"
  totalTiket: number;
  totalUang: number;
  list: Tiket[];
};

// Kelompokkan transaksi per tanggal (terbaru duluan) — dipakai buat tampilan
// laporan bergaya riwayat mutasi mbanking, lengkap sama subtotal tiap tanggal.
export function kelompokPerTanggal(list: Tiket[]): KelompokTanggal[] {
  return kelompokkanPerTanggal(list, (t) => t.dibuatPada).map((k) => ({
    kunci: k.kunci,
    label: k.label,
    totalTiket: k.list.reduce((a, t) => a + t.jumlah, 0),
    totalUang: k.list.reduce((a, t) => a + t.total, 0),
    list: k.list,
  }));
}

