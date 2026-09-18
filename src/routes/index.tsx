import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroScene } from "@/components/HeroScene";
import { LatarAmbient } from "@/components/LatarAmbient";
import { MomentCarousel, type SlideMomen } from "@/components/MomentCarousel";
import { Navbar } from "@/components/Navbar";
import { Reveal } from "@/components/Reveal";
import { HARGA, rupiah } from "@/lib/tickets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sopo Harimotting — Wisata Keluarga" },
      {
        name: "description",
        content:
          "Sopo Harimotting — wisata keluarga dengan area kuda, taman, gazebo piknik, dan jajanan. Beli tiket masuk langsung dari sini.",
      },
      { property: "og:title", content: "Sopo Harimotting — Wisata Keluarga" },
      {
        property: "og:description",
        content:
          "Wisata keluarga dengan area kuda, taman, gazebo piknik, dan jajanan.",
      },
    ],
  }),
  component: LandingPage,
});

// Mau nambah fasilitas baru? Copy 1 blok { ikon, judul, teks } di bawah,
// tempel, ganti isinya. Urutannya otomatis selang-seling kiri-kanan sendiri.
const FASILITAS = [
  {
    ikon: "🐴",
    judul: "Lihat Kuda",
    teks: "Area kuda dan patung-patung hewan di taman, jadi spot favorit anak-anak.",
  },
  {
    ikon: "🌳",
    judul: "Taman Terbuka",
    teks: "Rumput luas dan sejuk, cocok digelar tikar buat piknik keluarga.",
  },
  {
    ikon: "🏕️",
    judul: "Gazebo Piknik",
    teks: "Tempat duduk teduh beratap jaring, nyaman buat istirahat sambil ngobrol.",
  },
  {
    ikon: "🎪",
    judul: "Area Bermain",
    teks: "Rintangan dan rumah pohon yang seru buat anak-anak berlari dan memanjat.",
  },
  {
    ikon: "🛍️",
    judul: "Warung & Jajanan",
    teks: "Aneka snack dan minuman dingin tersedia langsung di lokasi.",
  },
  {
    ikon: "📸",
    judul: "Spot Foto",
    teks: "Banyak sudut menarik yang sayang dilewatkan buat foto keluarga.",
  },
];

// ============================================================================
// DAFTAR "MOMEN" DI CAROUSEL GALERI (section "Momen di Sini" di bawah).
// Mau nambah area/momen baru? Tinggal copy 1 blok { ... } di bawah, tempel di
// bawahnya, ganti isinya. Contoh nambah "Kolam Ikan":
//
//   {
//     variasi: "kolam-ikan",             // nama bebas, dipakai ilustrasi generik
//                                         // sampai kamu isi `foto` di bawah
//     judul: "Kolam Ikan",
//     teks: "Deskripsi singkat area ini.",
//     foto: "/images/kolam-ikan.jpg",    // opsional — hapus baris ini dulu
//                                         // kalau foto asli belum ada
//   },
//
// Gak perlu ubah file lain — carousel-nya otomatis nambah slide sendiri.
// ============================================================================
const MOMEN: SlideMomen[] = [
  {
    variasi: "kelinci",
    judul: "Dekat dengan Kelinci",
    teks: "Lihat langsung, ajak anak berkenalan dengan kelinci di taman.",
  },
  {
    variasi: "gazebo",
    judul: "Piknik di Gazebo",
    teks: "Duduk santai di bawah gazebo beratap jaring sambil menikmati udara terbuka.",
  },
  {
    variasi: "warung",
    judul: "Jajan di Warung",
    teks: "Lapar atau haus? Warung kecil kami siap dengan aneka jajanan dan minuman dingin.",
  },
];

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background pb-10">
      <LatarAmbient />
      <Navbar />

      <div className="relative z-10">
        {/* HERO */}
        <div className="relative">
          <HeroScene />
          <div className="hero-muncul absolute inset-x-0 bottom-16 px-4 text-center text-cream sm:bottom-20">
            <p className="text-xs font-bold tracking-[0.35em] uppercase opacity-75">
              Selamat datang di
            </p>
            <h1 className="mt-2 font-display text-6xl font-black drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:text-7xl">
              Sopo Harimotting
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
          <Reveal id="tentang" className="mb-16 scroll-mt-24">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-primary/70">
              Tentang kami
            </p>
            <h2 className="mb-4 font-display text-4xl font-black leading-tight">
              Satu tempat, <span className="italic">banyak cerita</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              {/* TODO: ganti dengan deskripsi asli tempat wisata */}
              Sopo Harimotting adalah tempat wisata keluarga dengan suasana alam
              terbuka, area kuda, taman, dan tempat piknik yang nyaman. Cocok
              untuk liburan bersama keluarga maupun rombongan.
            </p>
          </Reveal>

          {/* MOMEN — carousel geser horizontal, beberapa kartu keliatan sekaligus */}
          <Reveal id="momen" className="mb-16 scroll-mt-24">
            <MomentCarousel slide={MOMEN} />
          </Reveal>

          {/* FASILITAS — daftar editorial, bukan grid kartu identik */}
          <Reveal id="fasilitas" className="mb-16 scroll-mt-24">
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
                    <p className="mt-1 text-sm text-muted-foreground">
                      {f.teks}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* HARGA TIKET — gaya kartu tiket bergerigi */}
          <Reveal id="harga" className="mb-16 scroll-mt-24">
            <h2 className="mb-6 font-display text-4xl font-black">
              Harga Tiket Masuk
            </h2>
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
          <Reveal id="lokasi" className="mb-4 scroll-mt-24">
            <h2 className="mb-6 font-display text-4xl font-black">Lokasi</h2>
            <div className="panel-kayu rounded-2xl p-6 shadow-lift sm:p-8">
              <p className="font-bold opacity-90">📍 Alamat</p>
              <p className="mt-1 opacity-80">
                Desa Paniaran, Kecamatan Siborongborong, Kabupaten Tapanuli
                Utara, Sumatera Utara.
              </p>

              <div className="garis-emas my-5 w-full opacity-40" />

              <p className="font-bold opacity-90">🕘 Jam Operasional</p>
              {/* TODO: ganti dengan jam operasional asli */}
              <p className="mt-1 opacity-80">Setiap hari, 08.00 – 17.00 WIB</p>

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

          {/* KONTAK & SOSIAL MEDIA */}
          <Reveal className="mb-4">
            <h2 className="mb-6 font-display text-4xl font-black">
              Hubungi & Ikuti Kami
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <a
                href="https://wa.me/6282213079439"
                target="_blank"
                rel="noopener noreferrer"
                className="kartu-farm flex flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="text-3xl">💬</span>
                <span className="text-sm font-black">WhatsApp</span>
              </a>

              <a
                href="https://www.instagram.com/sopo_harimotting?stkn=a3B1b2JoMjk4aWNw"
                target="_blank"
                rel="noopener noreferrer"
                className="kartu-farm flex flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm font-black">Instagram</span>
              </a>

              <a
                href="https://www.tiktok.com/@sopoharimottingofficial?_r=1&_t=ZS-99aqjzQvm3Y"
                target="_blank"
                rel="noopener noreferrer"
                className="kartu-farm flex flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="text-3xl">🎵</span>
                <span className="text-sm font-black">TikTok</span>
              </a>
            </div>
          </Reveal>

          <div className="mt-10 text-center">
            <Link
              to="/login"
              className="text-sm font-bold text-muted-foreground underline"
            >
              Masuk sebagai petugas/admin/manager →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
