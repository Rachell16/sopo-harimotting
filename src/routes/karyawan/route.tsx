import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loginKaryawan } from "@/lib/karyawan.server";

export const Route = createFileRoute("/karyawan")({
  component: KaryawanLayout,
});

const KEY_SESI = "karyawan-sesi"; // JSON { kode, nama }

function KaryawanLayout() {
  const [sesi, setSesi] = useState<{ kode: string; nama: string } | null | undefined>(undefined);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [memeriksa, setMemeriksa] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(KEY_SESI);
    setSesi(raw ? JSON.parse(raw) : null);
  }, []);

  async function submit() {
    setMemeriksa(true);
    setError(null);
    try {
      const k = await loginKaryawan({ data: pin });
      const info = { kode: k.kode, nama: k.nama };
      sessionStorage.setItem(KEY_SESI, JSON.stringify(info));
      setSesi(info);
    } catch (err: any) {
      setError(err?.message || "PIN tidak dikenali.");
    } finally {
      setMemeriksa(false);
    }
  }

  if (sesi === undefined) return null;

  if (!sesi) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="kartu-farm w-full max-w-sm p-6 text-center">
          <span className="text-5xl">👷</span>
          <h1 className="mt-3 font-display text-2xl font-black">Login Karyawan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masukkan PIN kamu buat masuk ke dashboard absensi pribadi.
          </p>

          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="PIN"
            className="mt-5 h-14 w-full rounded-xl border-4 border-border bg-background text-center font-display text-2xl font-black tracking-widest"
            autoFocus
          />

          {error ? <p className="mt-2 text-sm font-bold text-destructive">{error}</p> : null}

          <button
            onClick={submit}
            disabled={memeriksa || !pin}
            className="mt-5 w-full rounded-2xl bg-accent px-4 py-4 font-display text-xl font-black text-accent-foreground shadow-lift disabled:opacity-60"
          >
            {memeriksa ? "Memeriksa..." : "Masuk"}
          </button>

          <div className="mt-4 flex flex-col items-center gap-2">
            <Link to="/" className="text-sm font-bold text-muted-foreground underline">
              ← Kembali ke beranda
            </Link>
            <Link to="/login" className="text-sm font-bold text-muted-foreground underline">
              🔁 Ganti peran
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          sessionStorage.removeItem(KEY_SESI);
          setSesi(null);
        }}
        className="fixed right-3 top-3 z-40 rounded-full bg-card/95 px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-farm backdrop-blur"
      >
        🔒 Keluar
      </button>
      <Outlet />
    </div>
  );
}
