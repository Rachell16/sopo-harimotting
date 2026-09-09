import { useEffect, useRef, useState, type ReactNode } from "react";

// Satu treatment reveal yang konsisten dipakai di semua section landing page
// (bukan efek beda-beda tiap elemen) — fade + naik sedikit saat discroll ke layar.
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tampil, setTampil] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setTampil(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${tampil ? "reveal-tampil" : ""} ${className}`}>
      {children}
    </div>
  );
}
