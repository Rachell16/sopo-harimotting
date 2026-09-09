import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cekPinAdmin } from "@/lib/admin-auth.server";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const KEY_SESI = "admin-masuk";

function AdminLayout() {
  const [sudahMasuk, setSudahMasuk] = useState<boolean | null>(null); // null = masih cek
  const [pin, setPin] = useState("");
  const [salah, setSalah] = useState(false);
  const [memeriksa, setMemeriksa] = useState(false);

  useEffect(() => {
    setSudahMasuk(sessionStorage.getItem(KEY_SESI) === "1");
  }, []);

  async function submit() {
    setMemeriksa(true);
    setSalah(false);
    try {
      const { ok } = await cekPinAdmin({ data: pin });
      if (ok) {
        sessionStorage.setItem(KEY_SESI, "1");
        setSudahMasuk(true);
      } else {
        setSalah(true);
      }
    } finally {
      setMemeriksa(false);
    }
  }

  if (sudahMasuk === null) return null; // hindari kedip sebelum cek sessionStorage selesai

  if (!sudahMasuk) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="kartu-farm w-full max-w-sm p-6 text-center">
          <span className="text-5xl">🔒</span>
          <h1 className="mt-3 font-display text-2xl font-black">Masuk Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Khusus petugas — masukkan PIN untuk lanjut ke Scan &amp; Laporan.
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

          {salah ? <p className="mt-2 text-sm font-bold text-destructive">PIN salah, coba lagi.</p> : null}

          <button
            onClick={submit}
            disabled={memeriksa || !pin}
            className="mt-5 w-full rounded-2xl bg-accent px-4 py-4 font-display text-xl font-black text-accent-foreground shadow-lift disabled:opacity-60"
          >
            {memeriksa ? "Memeriksa..." : "Masuk"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="fixed right-3 top-3 z-40 flex gap-2">
        <Link
          to="/admin/pengaturan"
          className="rounded-full bg-card/95 px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-farm backdrop-blur"
        >
          ⚙️ Pengaturan
        </Link>
        <button
          onClick={() => {
            sessionStorage.removeItem(KEY_SESI);
            setSudahMasuk(false);
          }}
          className="rounded-full bg-card/95 px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-farm backdrop-blur"
        >
          🔒 Keluar
        </button>
      </div>
      <Outlet />
    </div>
  );
}
