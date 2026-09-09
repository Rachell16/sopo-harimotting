// Placeholder foto — dibuat kayak bingkai foto beneran (gradasi warna golden-hour +
// bingkai kayu), bukan kotak putus-putus, supaya tetap enak dilihat sebelum foto
// aslinya di-upload.
//
// Nanti kalau foto aslinya udah ada:
// 1. Taruh file foto di folder `public/images/` (misal: public/images/hero.jpg)
// 2. Ganti <FotoPlaceholder label="..." /> jadi:
//    <div className="bingkai-foto bingkai-foto-hover overflow-hidden">
//      <img src="/images/hero.jpg" alt="..." className="h-full w-full object-cover" />
//    </div>
//    (pindahkan className ukuran seperti h-[60vh] / aspect-square ke div pembungkusnya)

export function FotoPlaceholder({
  label,
  className = "",
  rotasi = 0,
}: {
  label: string;
  className?: string;
  /** Rotasi kecil (derajat) biar kesan foto ditempel santai, bukan kaku grid. */
  rotasi?: number;
}) {
  return (
    <div
      className={`bingkai-foto bingkai-foto-hover flex flex-col items-center justify-center gap-2 ${className}`}
      style={{ transform: `rotate(${rotasi}deg)` }}
    >
      <span className="text-4xl opacity-70 drop-shadow-sm">🖼️</span>
      <span className="px-3 text-center text-sm font-bold text-wood-dark/80">{label}</span>
    </div>
  );
}
