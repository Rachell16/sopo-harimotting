import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { absenDenganPin } from "@/lib/karyawan.server";

export const Route = createFileRoute("/absen")({
  head: () => ({
    meta: [{ title: "Absensi Karyawan — Sopo Harimoting" }],
  }),
  component: AbsenPage,
});

function AbsenPage() {
  const [pin, setPin] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [hasil, setHasil] = useState<{ nama: string; aksi: "masuk" | "keluar" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (data: { pin: string; foto: string }) => absenDenganPin({ data }),
    onSuccess: (res) => {
      setHasil({ nama: res.karyawan.nama, aksi: res.aksi });
      setError(null);
      setPin("");
      setFoto(null);
    },
    onError: (err: any) => {
      setError(err?.message || "PIN tidak dikenali, coba lagi.");
      setHasil(null);
    },
  });

  function pilihFoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  const siapAbsen = pin.trim().length > 0 && !!foto;
  const waktuSekarang = new Date().toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/70">
            Sopo Harimoting
          </p>
          <h1 className="mt-1 font-display text-3xl font-black">Absensi Karyawan</h1>
          <p className="mt-1 text-sm text-muted-foreground">{waktuSekarang}</p>
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
          <div className="kartu-farm p-6">
            <label className="block text-center text-sm font-bold text-muted-foreground">PIN kamu</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="mt-2 h-16 w-full rounded-2xl border-4 border-border bg-background text-center font-display text-3xl font-black tracking-widest"
              autoFocus
            />

            <p className="mt-5 text-center text-sm font-bold text-muted-foreground">
              Foto bukti kamu sudah di lokasi
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => pilihFoto(e.target.files?.[0])}
            />

            {foto ? (
              <div className="mt-3">
                <img src={foto} alt="Preview foto absen" className="w-full rounded-2xl border-4 border-wood object-cover" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 w-full text-center text-sm font-bold text-muted-foreground underline"
                >
                  Ambil ulang foto
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-3 w-full rounded-2xl border-4 border-dashed border-wood/40 bg-secondary/60 px-4 py-8 text-center"
              >
                <span className="block text-4xl">📸</span>
                <span className="mt-2 block font-black text-secondary-foreground">Ambil / Upload Foto</span>
              </button>
            )}

            {error ? <p className="mt-3 text-sm font-bold text-destructive">{error}</p> : null}

            <button
              onClick={() => siapAbsen && mutation.mutate({ pin, foto: foto! })}
              disabled={!siapAbsen || mutation.isPending}
              className="mt-5 w-full rounded-2xl bg-accent px-4 py-5 font-display text-xl font-black text-accent-foreground shadow-lift disabled:opacity-60"
            >
              {mutation.isPending
                ? "Memproses..."
                : !pin.trim()
                  ? "Isi PIN Dulu"
                  : !foto
                    ? "Ambil Foto Dulu"
                    : "Absen Sekarang"}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Absen pertama = masuk. Absen kedua di hari yang sama = keluar. Waktu tercatat otomatis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
