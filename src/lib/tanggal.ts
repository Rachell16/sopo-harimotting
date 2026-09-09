export function labelTanggal(d: Date): string {
  const sekarang = new Date();
  const kemarin = new Date(sekarang);
  kemarin.setDate(kemarin.getDate() - 1);

  if (d.toDateString() === sekarang.toDateString()) return "Hari ini";
  if (d.toDateString() === kemarin.toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type KelompokTanggal<T> = {
  kunci: string; // YYYY-MM-DD
  label: string; // "Hari ini" / "Kemarin" / "Senin, 8 September 2026"
  list: T[];
};

// Kelompokkan list apa pun per tanggal (terbaru duluan) berdasarkan field waktu ISO
// yang ditunjuk oleh `ambilIso`. Total/subtotal dihitung di pemanggil karena tiap
// jenis data (tiket, penjualan) punya cara hitung yang beda.
export function kelompokkanPerTanggal<T>(list: T[], ambilIso: (item: T) => string): KelompokTanggal<T>[] {
  const map = new Map<string, T[]>();

  for (const item of list) {
    const d = new Date(ambilIso(item));
    const kunci = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!map.has(kunci)) map.set(kunci, []);
    map.get(kunci)!.push(item);
  }

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([kunci, items]) => ({
      kunci,
      label: labelTanggal(new Date(ambilIso(items[0]!))),
      list: items,
    }));
}
