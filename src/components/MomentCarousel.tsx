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
// Itu aja — carousel, titik indikator, sama nomor slide di bawah semua
// otomatis nyesuain jumlah slide, gak perlu ubah apa-apa di file ini.
// ============================================================================

export function MomentCarousel({ slide }: { slide: SlideMomen[] }) {
  const [aktif, setAktif] = useState(0);
  const [popup, setPopup] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Autoplay — jeda kalau lagi pop-up dibuka.
  useEffect(() => {
    if (popup !== null) return;
    timerRef.current = setInterval(() => {
      setAktif((n) => (n + 1) % slide.length);
    }, 4200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [popup, slide.length]);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border-4 border-wood shadow-lift">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(-${aktif * 100}%)` }}
          >
            {slide.map((m, i) => (
              <button
                key={m.judul}
                onClick={() => setPopup(i)}
                className="w-full shrink-0 text-left"
                aria-label={`Lihat lebih besar: ${m.judul}`}
              >
                <div className="relative">
                  <MomentIllustration variasi={m.variasi} foto={m.foto} />
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-black/10 to-black/30 p-5">
                    {/* Nomor slide, gaya "01 / 03" kayak carousel destinasi situs wisata besar */}
                    <div className="flex justify-between">
                      <span className="rounded-full bg-cream/90 px-3 py-1 font-display text-sm font-black text-wood-dark shadow">
                        {String(i + 1).padStart(2, "0")} / {String(slide.length).padStart(2, "0")}
                      </span>
                      <span className="rounded-full bg-cream/90 px-3 py-1 text-xs font-bold text-wood-dark shadow">
                        🔍 Perbesar
                      </span>
                    </div>

                    <div className="text-cream">
                      <p className="font-display text-2xl font-black drop-shadow sm:text-3xl">{m.judul}</p>
                      <p className="mt-1 text-sm opacity-95 sm:text-base">{m.teks}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tombol panah — lebih gede & selalu keliatan, senada bingkai kayu */}
        <button
          onClick={() => setAktif((n) => (n - 1 + slide.length) % slide.length)}
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-xl font-black text-wood-dark shadow-lift transition hover:scale-110 sm:h-12 sm:w-12"
          aria-label="Sebelumnya"
        >
          ‹
        </button>
        <button
          onClick={() => setAktif((n) => (n + 1) % slide.length)}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-xl font-black text-wood-dark shadow-lift transition hover:scale-110 sm:h-12 sm:w-12"
          aria-label="Berikutnya"
        >
          ›
        </button>
      </div>

      {/* Titik indikator */}
      <div className="mt-4 flex justify-center gap-2">
        {slide.map((m, i) => (
          <button
            key={m.judul}
            onClick={() => setAktif(i)}
            aria-label={`Ke slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === aktif ? "w-7 bg-primary" : "w-2 bg-primary/30"
            }`}
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
