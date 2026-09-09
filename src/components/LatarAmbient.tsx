// Partikel ambient (daun kecil) yang melayang pelan di seluruh halaman —
// dekorasi latar supaya halaman terasa "hidup" sepanjang scroll, bukan cuma di hero.
// fixed + pointer-events-none, jadi gak ganggu interaksi apa pun.
const DAUN = [
  { left: "6%", delay: "0s", durasi: "16s", ukuran: 14 },
  { left: "18%", delay: "3s", durasi: "20s", ukuran: 10 },
  { left: "34%", delay: "7s", durasi: "18s", ukuran: 12 },
  { left: "52%", delay: "1s", durasi: "22s", ukuran: 9 },
  { left: "68%", delay: "5s", durasi: "17s", ukuran: 13 },
  { left: "84%", delay: "9s", durasi: "19s", ukuran: 11 },
  { left: "94%", delay: "2s", durasi: "21s", ukuran: 10 },
];

export function LatarAmbient() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {DAUN.map((d, i) => (
        <span
          key={i}
          className="daun-melayang absolute top-[-5%]"
          style={{
            left: d.left,
            animationDelay: d.delay,
            animationDuration: d.durasi,
          }}
        >
          <svg width={d.ukuran} height={d.ukuran} viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2C14 4 18 8 18 13C18 16.5 14.5 18 10 18C5.5 18 2 16.5 2 13C2 8 6 4 10 2Z"
              fill="oklch(0.4 0.09 42 / 0.22)"
            />
            <path d="M10 3V17" stroke="oklch(0.24 0.05 40 / 0.3)" strokeWidth="0.6" />
          </svg>
        </span>
      ))}
    </div>
  );
}
