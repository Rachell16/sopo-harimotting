// ============================================================================
// ILUSTRASI MOMEN — dipakai di carousel "Momen di Sini" di halaman utama.
//
// ADA 2 CARA NAMPILIN 1 SLIDE:
// 1. Foto asli — kasih prop `foto` (path ke file di folder public/, misal
//    "/images/kuda-1.jpg"). Kalau foto diisi, foto itu yang ditampilin,
//    ilustrasi SVID di bawah otomatis di-skip.
// 2. Ilustrasi gambar tangan — biarin `foto` kosong, isi `variasi` sesuai
//    salah satu yang udah ada ("kuda" | "kelinci" | "gazebo" | "warung").
//    Kalau kamu isi nama variasi BARU yang belum ada gambarnya di bawah,
//    otomatis dia jatuh ke ilustrasi generik (bukit + matahari) — jadi gak
//    akan error, cuma gambarnya polos aja sampai digambarin variasi barunya
//    (atau sampai kamu upload foto asli dan pakai cara #1 di atas).
// ============================================================================

export function MomentIllustration({
  variasi,
  foto,
}: {
  variasi: string;
  foto?: string;
}) {
  // Cara #1: foto asli udah ada → tampilin itu aja.
  if (foto) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <img src={foto} alt={variasi} className="h-full w-full object-cover" />
      </div>
    );
  }

  // Cara #2: ilustrasi SVG. Latar gradasi + siluet bukit ini dipakai semua
  // variasi, tinggal bagian bawah yang beda-beda per variasi.
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.86 0.05 85) 0%, oklch(0.9 0.07 78) 45%, oklch(0.94 0.06 82) 100%)",
        }}
      />
      <svg className="absolute bottom-0 h-3/5 w-full" viewBox="0 0 300 160" preserveAspectRatio="none">
        <path d="M0,110 Q80,70 160,95 T300,80 L300,160 L0,160 Z" fill="oklch(0.42 0.08 42)" />
      </svg>

      {variasi === "kuda" && (
        <g>
          <circle cx="230" cy="46" r="20" fill="oklch(0.9 0.14 85)" className="absolute" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 225">
            <circle cx="230" cy="46" r="18" fill="oklch(0.9 0.14 85)" />
            <g transform="translate(110,110) scale(2.1)" fill="oklch(0.22 0.05 42)">
              <path d="M10 40 C8 25 14 14 26 10 C30 6 38 4 44 8 C50 5 58 8 58 16 C64 16 68 22 64 28 C68 32 66 40 60 40 L58 52 L52 52 L50 42 L34 42 L32 52 L26 52 L26 42 C16 42 10 42 10 40 Z" />
              <rect x="30" y="42" width="4" height="14" />
              <rect x="46" y="42" width="4" height="14" />
            </g>
          </svg>
        </g>
      )}

      {variasi === "kelinci" && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 225">
          <circle cx="230" cy="46" r="18" fill="oklch(0.9 0.14 85)" />
          <g transform="translate(115,95) scale(2.3)" fill="oklch(0.9 0.02 90)" stroke="oklch(0.22 0.05 42)" strokeWidth="1.2">
            {/* Telinga */}
            <ellipse cx="14" cy="6" rx="4" ry="14" transform="rotate(-12 14 6)" />
            <ellipse cx="26" cy="6" rx="4" ry="14" transform="rotate(12 26 6)" />
            {/* Badan */}
            <ellipse cx="20" cy="34" rx="15" ry="12" />
            {/* Kepala */}
            <circle cx="20" cy="20" r="11" />
            {/* Mata */}
            <circle cx="16" cy="19" r="1.4" fill="oklch(0.22 0.05 42)" stroke="none" />
            <circle cx="24" cy="19" r="1.4" fill="oklch(0.22 0.05 42)" stroke="none" />
            {/* Ekor */}
            <circle cx="34" cy="40" r="3" />
          </g>
        </svg>
      )}

      {variasi === "gazebo" && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 225">
          <circle cx="70" cy="40" r="16" fill="oklch(0.9 0.14 85)" />
          <polygon points="150,90 210,90 180,55" fill="oklch(0.24 0.05 42)" />
          <rect x="158" y="90" width="44" height="42" fill="oklch(0.3 0.06 42)" />
          <rect x="160" y="92" width="4" height="40" fill="oklch(0.22 0.05 42)" />
          <rect x="196" y="92" width="4" height="40" fill="oklch(0.22 0.05 42)" />
        </svg>
      )}

      {variasi === "warung" && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 225">
          <circle cx="240" cy="38" r="16" fill="oklch(0.9 0.14 85)" />
          <rect x="120" y="96" width="80" height="38" fill="oklch(0.28 0.06 42)" />
          <path d="M112 96 L208 96 L196 76 L124 76 Z" fill="oklch(0.5 0.15 30)" />
          <rect x="132" y="110" width="16" height="24" fill="oklch(0.9 0.14 85)" />
        </svg>
      )}

      {/* Fallback generik — dipakai otomatis kalau kamu isi `variasi` dengan
          nama baru yang belum digambarin di atas. Aman, gak akan blank/error. */}
      {!["kuda", "kelinci", "gazebo", "warung"].includes(variasi) && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 225">
          <circle cx="150" cy="46" r="18" fill="oklch(0.9 0.14 85)" />
        </svg>
      )}
    </div>
  );
}
