import { useEffect, useRef, useState } from "react";
import { MomentIllustration } from "./MomentIllustration";

export type SlideMomen = {
  variasi: "kuda" | "kelinci" | "gazebo" | "warung";
  judul: string;
  teks: string;
};

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
      <div className="relative">
        <div className="overflow-hidden rounded-2xl">
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
                  <MomentIllustration variasi={m.variasi} />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/55 via-transparent to-transparent p-5">
                    <div className="text-cream">
                      <p className="font-display text-2xl font-black drop-shadow">{m.judul}</p>
                      <p className="mt-1 text-sm opacity-90">{m.teks}</p>
                    </div>
                  </div>
                  <span className="absolute right-3 top-3 rounded-full bg-cream/90 px-3 py-1 text-xs font-bold text-wood-dark shadow">
                    🔍 Perbesar
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tombol panah */}
        <button
          onClick={() => setAktif((n) => (n - 1 + slide.length) % slide.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-cream/90 p-2 text-wood-dark shadow-lift transition hover:scale-110"
          aria-label="Sebelumnya"
        >
          ‹
        </button>
        <button
          onClick={() => setAktif((n) => (n + 1) % slide.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-cream/90 p-2 text-wood-dark shadow-lift transition hover:scale-110"
          aria-label="Berikutnya"
        >
          ›
        </button>

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
            <MomentIllustration variasi={slide[popup]!.variasi} />
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
