import { kelompokkanPerTanggal } from "./tanggal";

export type MetodeBayar = "cash" | "qris";

export type Produk = {
  kode: string;
  nama: string;
  harga: number;
  stok: number;
  dibuatPada: string;
};

export type ItemKeranjang = {
  kode: string;
  nama: string;
  harga: number;
  qty: number;
};

export type Penjualan = {
  kode: string;
  item: ItemKeranjang[];
  total: number;
  metode: MetodeBayar;
  waktu: string;
};

export function totalKeranjang(keranjang: ItemKeranjang[]) {
  return keranjang.reduce((a, i) => a + i.harga * i.qty, 0);
}

export type KelompokPenjualan = {
  kunci: string;
  label: string;
  totalItem: number;
  totalUang: number;
  list: Penjualan[];
};

export function kelompokPenjualanPerTanggal(list: Penjualan[]): KelompokPenjualan[] {
  return kelompokkanPerTanggal(list, (p) => p.waktu).map((k) => ({
    kunci: k.kunci,
    label: k.label,
    totalItem: k.list.reduce((a, p) => a + p.item.reduce((b, i) => b + i.qty, 0), 0),
    totalUang: k.list.reduce((a, p) => a + p.total, 0),
    list: k.list,
  }));
}
