import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "#tentang", label: "Tentang" },
  { href: "#momen", label: "Galeri" },
  { href: "#fasilitas", label: "Fasilitas" },
  { href: "#harga", label: "Harga" },
  { href: "#lokasi", label: "Lokasi" },
];

// Transparan & teks krem di atas hero, begitu discroll lewat hero otomatis
// jadi panel kayu solid + shadow, kayak navbar situs wisata besar pada umumnya.
export function Navbar() {
  const [discroll, setDiscroll] = useState(false);

  useEffect(() => {
    function cekScroll() {
      setDiscroll(window.scrollY > 64);
    }
    cekScroll();
    window.addEventListener("scroll", cekScroll, { passive: true });
    return () => window.removeEventListener("scroll", cekScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        discroll ? "panel-kayu shadow-lift" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
  <a href="#" className="flex items-center gap-2 text-cream">
    <img
      src="/favicon.ico"
      className="h-8 w-8 object-contain"
    />

    <span className="font-display text-lg font-black tracking-tight sm:text-xl">
      Sopo Harimotting
    </span>
  </a>
</div>

        <div className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-bold text-cream/90 transition hover:text-cream"
            >
              {l.label}
            </a>
          ))}
        </div>

        <Link
          to="/kasir"
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-black text-accent-foreground shadow-farm transition hover:-translate-y-0.5 sm:px-5 sm:py-2.5"
        >
          🎟️ Beli Tiket
        </Link>
      </div>
    </nav>
  );
}
