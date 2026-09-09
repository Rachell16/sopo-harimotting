// Generator kode acak bersama, dipakai buat kode tiket, kode produk, kode penjualan, dll.
export function buatKode(prefix: string) {
  const huruf = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += huruf[Math.floor(Math.random() * huruf.length)];
  return `${prefix}-${s}`;
}
