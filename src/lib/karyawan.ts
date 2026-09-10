import { kelompokkanPerTanggal } from "./tanggal";

export type Karyawan = {
  kode: string;
  nama: string;
  pin: string;
  gajiHarian: number;
  aktif: boolean;
  dibuatPada: string;
};

export type Absensi = {
  kode: string;
  karyawanKode: string;
  masuk: string;
  keluar: string | null;
};

export type Pengeluaran = {
  kode: string;
  keterangan: string;
  jumlah: number;
  dibuatPada: string;
};

export function jamKerja(masuk: string, keluar: string | null): string {
  if (!keluar) return "Masih di lokasi";
  const menit = Math.round((new Date(keluar).getTime() - new Date(masuk).getTime()) / 60000);
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  return `${jam} jam ${sisaMenit} menit`;
}

export type KelompokAbsensi = {
  kunci: string;
  label: string;
  list: Absensi[];
};

export function kelompokAbsensiPerTanggal(list: Absensi[]): KelompokAbsensi[] {
  return kelompokkanPerTanggal(list, (a) => a.masuk);
}
