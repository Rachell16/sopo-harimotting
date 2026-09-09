import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroScene } from "@/components/HeroScene";
import { LatarAmbient } from "@/components/LatarAmbient";
import { MomentCarousel, type SlideMomen } from "@/components/MomentCarousel";
import { Reveal } from "@/components/Reveal";
import { HARGA, rupiah } from "@/lib/tickets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sopo Harimoting — Wisata Keluarga" },
      {
        name: "description",
        content:
          "Sopo Harimoting — wisata keluarga dengan area kuda, taman, gazebo piknik, dan jajanan. Beli tiket masuk langsung dari sini.",
      },
      { property: "og:title", content: "Sopo Harimoting — Wisata Keluarga" },
      {
        property: "og:description",
        content: "Wisata keluarga dengan area kuda, taman, gazebo piknik, dan jajanan.",
      },
    ],
  }),
  component: LandingPage,
});

const FASILITAS = [
  { ikon: "🐴", judul: "Naik & Lihat Kuda", teks: "Area kuda dan patung-patung hewan di taman, jadi spot favorit anak-anak." },
  { ikon: "🌳", judul: "Taman Terbuka", teks: "Rumput luas dan sejuk, cocok digelar tikar buat piknik keluarga." },
  { ikon: "🏕️", judul: "Gazebo Piknik", teks: "Tempat duduk teduh beratap jaring, nyaman buat istirahat sambil ngobrol." },
  { ikon: "🎪", judul: "Area Bermain", teks: "Rintangan ban warna-warni yang seru buat anak-anak berlari dan memanjat." },
  { ikon: "🛍️", judul: "Warung & Jajanan", teks: "Aneka snack dan minuman dingin tersedia langsung di lokasi." },
  { ikon: "📸", judul: "Spot Foto", teks: "Banyak sudut menarik yang sayang dilewatkan buat foto keluarga." },
];

const MOMEN: SlideMomen[] = [
  { variasi: "kuda", judul: "Dekat dengan Kuda", teks: "Lihat langsung, ajak anak berkenalan dengan kuda-kuda di taman." },
  { variasi: "gazebo", judul: "Piknik di Gazebo", teks: "Duduk santai di bawah gazebo beratap jaring sambil menikmati udara terbuka." },
  { variasi: "warung", judul: "Jajan di Warung", teks: "Lapar atau haus? Warung kecil kami siap dengan aneka jajanan dan minuman dingin." },
];

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background pb-10">
      <LatarAmbient />

      <div className="relative z-10">
        {/* HERO */}
        <div className="relative">
          <HeroScene />
          <div className="hero-muncul absolute inset-x-0 bottom-16 px-4 text-center text-cream sm:bottom-20">
            <p className="text-xs font-bold tracking-[0.35em] uppercase opacity-75">
              Selamat datang di
            </p>
            <h1 className="mt-2 font-display text-6xl font-black drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:text-7xl">
              Sopo Harimoting
            </h1>
            <div className="garis-emas mx-auto mt-4 w-24" />
            <p className="mx-auto mt-4 max-w-md font-display text-lg italic opacity-95 sm:text-xl">
              Kuda, taman, gazebo, dan jajanan — dalam satu tempat
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4">
          {/* CTA BELI TIKET */}
          <div className="hero-muncul relative z-10 -mt-7 mb-14">
            <Link
              to="/kasir"
              className="cta-berdenyut block w-full rounded-2xl bg-accent px-4 py-5 text-center font-display text-2xl font-black text-accent-foreground transition hover:-translate-y-0.5 active:translate-y-0.5"
            >
              🎟️ Beli Tiket Masuk
            </Link>
          </div>

          {/* TENTANG */}
          <Reveal className="mb-16">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-primary/70">
              Tentang kami
            </p>
            <h2 className="mb-4 font-display text-4xl font-black leading-tight">
              Satu tempat, <span className="italic">banyak cerita</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              {/* TODO: ganti dengan deskripsi asli tempat wisata */}
              Sopo Harimoting adalah tempat wisata keluarga dengan suasana alam terbuka, area
              kuda, taman, dan tempat piknik yang nyaman. Cocok untuk liburan bersama keluarga
              maupun rombongan.
            </p>
          </Reveal>

          {/* MOMEN — carousel, bisa di-slide & diklik buat pop-up */}
          <Reveal className="mb-16">
            <h2 className="mb-1 font-display text-4xl font-black">Momen di Sini</h2>
            <p className="mb-6 text-muted-foreground">
              Geser atau klik foto untuk lihat lebih besar — foto asli menyusul.
            </p>
            <MomentCarousel slide={MOMEN} />
          </Reveal>

          {/* FASILITAS — daftar editorial, bukan grid kartu identik */}
          <Reveal className="mb-16">
            <h2 className="mb-6 font-display text-4xl font-black">Fasilitas</h2>
            <div className="divide-y-2 divide-dashed divide-border">
              {FASILITAS.map((f, i) => (
                <div
                  key={f.judul}
                  className={`flex items-center gap-5 py-5 ${i % 2 === 1 ? "flex-row-reverse text-right" : ""}`}
                >
                  <span
                    className="ikon-ayun shrink-0 text-4xl"
                    style={{ animationDelay: `${i * 0.25}s` }}
                  >
                    {f.ikon}
                  </span>
                  <div>
                    <p className="font-display text-xl font-black">{f.judul}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{f.teks}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* HARGA TIKET — gaya kartu tiket bergerigi */}
          <Reveal className="mb-16">
            <h2 className="mb-6 font-display text-4xl font-black">Harga Tiket Masuk</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="kartu-tiket p-5 text-center transition hover:-translate-y-1">
                <span className="text-3xl">🧑‍🌾</span>
                <p className="mt-1 font-display text-lg font-black">Dewasa</p>
                <p className="font-display text-3xl font-black text-primary">
                  {rupiah(HARGA.dewasa)}
                </p>
              </div>
              <div className="kartu-tiket p-5 text-center transition hover:-translate-y-1">
                <span className="text-3xl">🧒</span>
                <p className="mt-1 font-display text-lg font-black">Anak</p>
                <p className="font-display text-3xl font-black text-primary">
                  {rupiah(HARGA.anak)}
                </p>
              </div>
            </div>
          </Reveal>

          {/* ALAMAT & LOKASI — panel gelap senada hero, kontras premium */}
          <Reveal className="mb-4">
            <h2 className="mb-6 font-display text-4xl font-black">Lokasi</h2>
            <div className="panel-kayu rounded-2xl p-6 shadow-lift sm:p-8">
              <p className="font-bold opacity-90">📍 Alamat</p>
              {/* TODO: ganti dengan alamat asli */}
              <p className="mt-1 opacity-80">
                Desa Paniaran, Kecamatan Siborongborong, Kabupaten Tapanuli Utara, Sumatera Utara
              </p>

              <div className="garis-emas my-5 w-full opacity-40" />

              <p className="font-bold opacity-90">🕘 Jam Operasional</p>
              {/* TODO: ganti dengan jam operasional asli */}
              <p className="mt-1 opacity-80">Setiap hari, 12.00 – 18.00 WIB</p>

              <a
                href="https://www.google.com/maps/place/SOPO+HARIMOTTING/@2.1591974,98.9714991,17z/data=!3m1!4b1!4m6!3m5!1s0x302e130054edefdd:0x2806ff1165998444!8m2!3d2.159192!4d98.974074!16s%2Fg%2F11nqq_sdv6?entry=ttu&g_ep=EgoyMDI2MDkwMi4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block w-full rounded-2xl bg-accent px-4 py-4 text-center text-lg font-black text-accent-foreground transition hover:-translate-y-0.5"
              >
                Buka di Google Maps
              </a>
            </div>
          </Reveal>

          <div className="mt-10 text-center">
            <Link to="/admin/scan" className="text-sm font-bold text-muted-foreground underline">
              Masuk sebagai petugas/admin →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
