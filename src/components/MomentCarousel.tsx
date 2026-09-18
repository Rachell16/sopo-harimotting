import { useEffect, useRef, useState } from "react";
import { MomentIllustration } from "./MomentIllustration";

export type SlideMomen = {
  // Nama bebas (dipakai buat cari ilustrasi yang cocok di MomentIllustration.tsx,
  // "kuda" | "kelinci" | "gazebo" | "warung" udah ada gambarnya. Nama lain otomatis
  // pakai ilustrasi generik sampai foto asli diisi lewat `foto`).
  variasi: string;
  judul: string;
  teks: string;
  // Opsional — kalau diisi, foto asli ini yang ditampilin (bukan ilustrasi SVG).
  // Taruh file foto-nya di folder public/images/, terus isi path-nya di sini,
  // contoh: foto: "/images/kolam-ikan.jpg"
  foto?: string;
};

// ============================================================================
// CARA NAMBAH AREA/MOMEN BARU DI CAROUSEL INI:
// Buka src/routes/index.tsx, cari array `MOMEN`, tambahin object baru persis
// kayak yang udah ada, contoh:
//
//   { variasi: "kolam-ikan", judul: "Kolam Ikan", teks: "Deskripsi singkatnya di sini." }
//
// Itu aja — kartu baru otomatis nongol di ujung deretan, jumlah kartu yang
// keliatan sekaligus juga otomatis nyesuain lebar layar. Gak perlu ubah
// apa-apa di file ini.
// ============================================================================

export function MomentCarousel({ slide }: { slide: SlideMomen[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [aktif, setAktif] = useState(0);
  const [popup, setPopup] = useState<number | null>(null);

  // Deteksi kartu mana yang lagi paling keliatan di layar, buat nomor "01/03".
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function onScroll() {
      const kartu = track!.querySelector<HTMLElement>("[data-kartu]");
      if (!kartu) return;
      const lebarLangkah = kartu.offsetWidth + 16; // 16 = gap-4
      const idx = Math.round(track!.scrollLeft / lebarLangkah);
      setAktif(Math.max(0, Math.min(slide.length - 1, idx)));
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [slide.length]);

  function geser(arah: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const kartu = track.querySelector<HTMLElement>("[data-kartu]");
    if (!kartu) return;
    track.scrollBy({ left: arah * (kartu.offsetWidth + 16), behavior: "smooth" });
  }

  return (
    <>
      {/* Header baris: judul di kiri, nomor + panah navigasi di kanan —
          pola yang sama kayak carousel destinasi di situs wisata besar. */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary/70">Galeri</p>
          <h2 className="font-display text-3xl font-black sm:text-4xl">Momen di Sini</h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-display text-base font-black text-muted-foreground">
            {String(aktif + 1).padStart(2, "0")} / {String(slide.length).padStart(2, "0")}
          </span>
          <button
            onClick={() => geser(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-lg font-black text-secondary-foreground transition hover:scale-110"
            aria-label="Sebelumnya"
          >
            ‹
          </button>
          <button
            onClick={() => geser(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-lg font-black text-secondary-foreground transition hover:scale-110"
            aria-label="Berikutnya"
          >
            ›
          </button>
        </div>
      </div>

      {/* Deretan kartu — scroll horizontal native, beberapa kartu keliatan
          sekaligus (bukan 1 slide penuh layar kayak sebelumnya). */}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slide.map((m, i) => (
          <button
            key={m.judul}
            data-kartu
            onClick={() => setPopup(i)}
            className="w-[68%] shrink-0 snap-start text-left sm:w-[42%] lg:w-[30%]"
            aria-label={`Lihat lebih besar: ${m.judul}`}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border-4 border-wood shadow-lift">
              <MomentIllustration variasi={m.variasi} foto={m.foto} />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
                <p className="font-display text-lg font-black leading-tight text-cream drop-shadow sm:text-xl">
                  {m.judul}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-cream/90 sm:text-sm">{m.teks}</p>
                <span className="mt-3 inline-block rounded-full bg-cream px-3 py-1.5 text-center text-xs font-black text-wood-dark">
                  Lihat lebih besar
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Titik indikator */}
      <div className="mt-4 flex justify-center gap-2">
        {slide.map((m, i) => (
          <span
            key={m.judul}
            className={`h-2 rounded-full transition-all ${i === aktif ? "w-7 bg-primary" : "w-2 bg-primary/30"}`}
          />
        ))}
      </div>

      {/* Pop-up lightbox */}
      {popup !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          style={{ animation: "popup-masuk 0.25s ease-out both" }}
          onClick={() => setPopup(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-card shadow-2xl"
            style={{ animation: "popup-zoom 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
            onClick={(e) => e.stopPropagation()}
          >
            <MomentIllustration variasi={slide[popup]!.variasi} foto={slide[popup]!.foto} />
            <div className="p-5">
              <p className="font-display text-2xl font-black">{slide[popup]!.judul}</p>
              <p className="mt-1 text-muted-foreground">{slide[popup]!.teks}</p>
              <button
                onClick={() => setPopup(null)}
                className="mt-4 w-full rounded-xl bg-secondary px-4 py-3 font-bold text-secondary-foreground"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
