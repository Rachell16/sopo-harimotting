import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk — Sopo Harimoting" }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/70">
          Sopo Harimoting
        </p>
        <h1 className="mt-1 font-display text-3xl font-black">Masuk Sebagai</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pilih peran kamu buat lanjut</p>

        <div className="mt-6 grid gap-4">
          <Link
            to="/admin"
            className="kartu-farm flex items-center gap-4 p-5 text-left transition hover:-translate-y-1 hover:shadow-lift"
          >
            <span className="text-4xl">🔑</span>
            <div>
              <p className="font-display text-xl font-black">Petugas / Admin</p>
              <p className="text-sm text-muted-foreground">Scan tiket, kasir jajanan, stok, laporan</p>
            </div>
          </Link>

          <Link
            to="/manager"
            className="kartu-farm flex items-center gap-4 p-5 text-left transition hover:-translate-y-1 hover:shadow-lift"
          >
            <span className="text-4xl">🗝️</span>
            <div>
              <p className="font-display text-xl font-black">Manager</p>
              <p className="text-sm text-muted-foreground">Laporan keuangan, absensi, data karyawan</p>
            </div>
          </Link>
        </div>

        <Link to="/" className="mt-6 inline-block text-sm font-bold text-muted-foreground underline">
          ← Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
