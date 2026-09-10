import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { absenDenganPin } from "@/lib/karyawan.server";

export const Route = createFileRoute("/absen")({
  head: () => ({
    meta: [{ title: "Absensi Karyawan — Sopo Harimoting" }],
  }),
  component: AbsenPage,
});

function AbsenPage() {
  const [pin, setPin] = useState("");
  const [hasil, setHasil] = useState<{ nama: string; aksi: "masuk" | "keluar" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (pinInput: string) => absenDenganPin({ data: pinInput }),
    onSuccess: (res) => {
      setHasil({ nama: res.karyawan.nama, aksi: res.aksi });
      setError(null);
      setPin("");
    },
    onError: (err: any) => {
      setError(err?.message || "PIN tidak dikenali, coba lagi.");
      setHasil(null);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/70">
            Sopo Harimoting
          </p>
          <h1 className="mt-1 font-display text-3xl font-black">Absensi Karyawan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masukkan PIN kamu buat absen masuk / keluar
          </p>
        </div>

        {hasil ? (
          <div className="kartu-farm p-6 text-center">
            <span className="text-5xl">{hasil.aksi === "masuk" ? "✅" : "👋"}</span>
            <p className="mt-3 font-display text-xl font-black">
              {hasil.aksi === "masuk" ? "Absen Masuk Berhasil" : "Absen Keluar Berhasil"}
            </p>
            <p className="mt-1 text-muted-foreground">
              Sampai jumpa, {hasil.nama}! {hasil.aksi === "masuk" ? "Selamat bekerja 💪" : "Hati-hati di jalan 🙏"}
            </p>
            <button
              onClick={() => setHasil(null)}
              className="mt-5 w-full rounded-2xl bg-secondary px-4 py-3 font-black text-secondary-foreground"
            >
              Selesai
            </button>
          </div>
        ) : (
          <div className="kartu-farm p-6 text-center">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pin && mutation.mutate(pin)}
              placeholder="PIN kamu"
              className="h-16 w-full rounded-2xl border-4 border-border bg-background text-center font-display text-3xl font-black tracking-widest"
              autoFocus
            />

            {error ? <p className="mt-3 text-sm font-bold text-destructive">{error}</p> : null}

            <button
              onClick={() => pin && mutation.mutate(pin)}
              disabled={!pin || mutation.isPending}
              className="mt-5 w-full rounded-2xl bg-accent px-4 py-5 font-display text-xl font-black text-accent-foreground shadow-lift disabled:opacity-60"
            >
              {mutation.isPending ? "Memproses..." : "Absen Sekarang"}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Absen pertama = masuk. Absen kedua di hari yang sama = keluar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
