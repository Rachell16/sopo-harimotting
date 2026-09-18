// Adegan hero dibuat pakai SVG + CSS animation (bukan foto), supaya halaman tetap
// terasa "hidup" sebelum foto asli tempat wisata di-upload. Begitu foto asli ada,
// ganti isi <div className="hero-anim-zoom" ...> ini dengan <img> yang di-crop cover,
// animasi zoom & burungnya tetap bisa jalan di atasnya.



// export function HeroScene() {
//   return (
//     <div className="relative h-[100dvh] min-h-[560px] w-full overflow-hidden bg-wood-dark">
//       <div className="hero-anim-zoom absolute inset-0">
//         {/* Langit senja — lebih gelap & dramatis di atas, menyala di horizon */}
//         <div
//           className="absolute inset-0"
//           style={{
//             background:
//               "linear-gradient(180deg, oklch(0.16 0.04 250) 0%, oklch(0.28 0.06 235) 28%, oklch(0.48 0.09 55) 58%, oklch(0.74 0.15 72) 80%, oklch(0.84 0.12 82) 100%)",
//           }}
//         />

//         {/* Bintang halus di langit atas */}
//         {[8, 18, 32, 50, 68, 84, 93].map((left, i) => (
//           <span
//             key={left}
//             className="hero-anim-debu absolute top-[6%] h-1 w-1 rounded-full bg-cream/70"
//             style={{ left: `${left}%`, animationDelay: `${i * 0.9}s`, animationDuration: "5s" }}
//           />
//         ))}

//         {/* Matahari */}
//         <div
//           className="hero-anim-matahari absolute left-1/2 top-[30%] h-28 w-28 -translate-x-1/2 rounded-full sm:h-40 sm:w-40"
//           style={{ background: "oklch(0.92 0.14 85)" }}
//         />

//         {/* Burung terbang melintas */}
//         <svg className="hero-anim-burung absolute top-[24%] h-3 w-6" style={{ animationDuration: "13s" }} viewBox="0 0 24 12" fill="none">
//           <path d="M0 8 Q6 0 12 8 Q18 0 24 8" stroke="oklch(0.2 0.03 60)" strokeWidth="1.6" strokeLinecap="round" />
//         </svg>
//         <svg className="hero-anim-burung absolute top-[30%] h-2.5 w-5" style={{ animationDuration: "17s", animationDelay: "4s" }} viewBox="0 0 24 12" fill="none">
//           <path d="M0 8 Q6 0 12 8 Q18 0 24 8" stroke="oklch(0.2 0.03 60)" strokeWidth="1.6" strokeLinecap="round" />
//         </svg>
//         <svg className="hero-anim-burung absolute top-[20%] h-2.5 w-5" style={{ animationDuration: "20s", animationDelay: "9s" }} viewBox="0 0 24 12" fill="none">
//           <path d="M0 8 Q6 0 12 8 Q18 0 24 8" stroke="oklch(0.2 0.03 60)" strokeWidth="1.6" strokeLinecap="round" />
//         </svg>

//         {/* Debu / kunang-kunang cahaya */}
//         {[12, 28, 46, 62, 78, 90].map((left, i) => (
//           <span
//             key={`d${left}`}
//             className="hero-anim-debu absolute bottom-28 h-1.5 w-1.5 rounded-full bg-cream/90"
//             style={{ left: `${left}%`, animationDelay: `${i * 1.1}s` }}
//           />
//         ))}

//         {/* Bukit jauh */}
//         <svg
//           className="hero-anim-langit absolute bottom-20 left-0 h-44 w-[calc(100%+140px)] sm:h-64"
//           viewBox="0 0 1000 200"
//           preserveAspectRatio="none"
//         >
//           <path
//             d="M0,140 Q120,80 260,120 T520,110 T780,130 T1000,100 L1000,200 L0,200 Z"
//             fill="oklch(0.3 0.05 145 / 0.6)"
//           />
//         </svg>

//         {/* Bukit dekat + siluet kuda */}
//         <svg
//           className="absolute bottom-0 left-0 h-48 w-full sm:h-72"
//           viewBox="0 0 1000 220"
//           preserveAspectRatio="none"
//         >
//           <path
//             d="M0,160 Q180,90 380,130 T760,120 T1000,150 L1000,220 L0,220 Z"
//             fill="oklch(0.2 0.045 150)"
//           />
//           <g transform="translate(640,95) scale(1.25)" fill="oklch(0.13 0.03 145)">
//             <path d="M10 40 C8 25 14 14 26 10 C30 6 38 4 44 8 C50 5 58 8 58 16 C64 16 68 22 64 28 C68 32 66 40 60 40 L58 52 L52 52 L50 42 L34 42 L32 52 L26 52 L26 42 C16 42 10 42 10 40 Z" />
//             <rect x="30" y="42" width="4" height="14" />
//             <rect x="46" y="42" width="4" height="14" />
//           </g>
//         </svg>

//         {/* Rumput depan, bergoyang */}
//         <div className="absolute -bottom-1 left-0 flex w-full justify-around">
//           {Array.from({ length: 26 }).map((_, i) => (
//             <svg
//               key={i}
//               className="hero-anim-rumput h-12 w-4 sm:h-20"
//               viewBox="0 0 20 50"
//               style={{ animationDelay: `${(i % 6) * 0.3}s` }}
//             >
//               <path d="M10 50 Q2 30 6 0 Q10 26 10 50 Z" fill="oklch(0.2 0.045 150)" />
//               <path d="M10 50 Q18 28 14 4 Q12 28 10 50 Z" fill="oklch(0.26 0.05 148)" />
//             </svg>
//           ))}
//         </div>
//       </div>

//       {/* Vignette biar teks di bawah selalu kebaca */}
//       <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-wood-dark via-wood-dark/70 to-transparent" />
//       <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_60px_oklch(0.1_0.03_50_/_0.35)]" />

//       {/* Isyarat scroll */}
//       <div className="hero-anim-cuit absolute bottom-6 left-1/2 -translate-x-1/2 text-cream/70">
//         <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
//           <path d="M1 1L11 12L21 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//         </svg>
//       </div>
//     </div>
//   );
// }

export function HeroScene() {
  return (
    <div className="relative h-[100dvh] min-h-[560px] w-full overflow-hidden bg-wood-dark">

      {/* FOTO BACKGROUND */}
      <div className="hero-anim-zoom absolute inset-0">
        <img
          src="/image.png"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Overlay gelap di bagian bawah supaya tulisan tetap terbaca */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-wood-dark via-wood-dark/70 to-transparent" />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_60px_oklch(0.1_0.03_50_/_0.35)]" />

      {/* Isyarat scroll — bisa diklik/dipencet, langsung lompat ke section berikutnya */}
      <a
        href="#tentang"
        aria-label="Scroll ke bawah"
        className="hero-anim-cuit absolute bottom-6 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full text-cream/80 transition hover:bg-cream/10 hover:text-cream active:scale-90"
      >
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <path
            d="M1 1L11 12L21 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>

    </div>
  );
}