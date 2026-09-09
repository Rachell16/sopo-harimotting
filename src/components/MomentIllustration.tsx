// Ilustrasi kecil bergaya sama dengan hero (siluet + gradasi hangat), dipakai
// sebagai pengganti kotak "foto belum ada" yang diulang-ulang. Begitu foto asli
// tersedia, section yang memanggil ini tinggal diganti ke <img>.
export function MomentIllustration({ variasi }: { variasi: "kuda" | "kelinci" | "gazebo" | "warung" }) {
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
    </div>
  );
}
