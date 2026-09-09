import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { AppShell } from "@/components/AppShell";
import { buatTiketServer } from "@/lib/tickets.server";
import { HARGA, LABEL, rupiah, tanggalJam, type Kategori, type Tiket } from "@/lib/tickets";

export const Route = createFileRoute("/kasir")({
  head: () => ({
    meta: [
      { title: "Kasir Tiket — Sopo Harimoting" },
      {
        name: "description",
        content:
          "Loket kasir untuk membuat tiket masuk tempat wisata lengkap dengan QR code unik per transaksi.",
      },
      { property: "og:title", content: "Kasir Tiket — Sopo Harimoting" },
      {
        property: "og:description",
        content: "Buat tiket masuk dan QR code pengunjung langsung dari loket.",
      },
    ],
  }),
  component: KasirPage,
});

function KasirPage() {
  const [kategori, setKategori] = useState<Kategori>("dewasa");
  const [jumlah, setJumlah] = useState(1);
  const [tiket, setTiket] = useState<Tiket | null>(null);
  const queryClient = useQueryClient();

  const buatMutation = useMutation({
    mutationFn: (input: { kategori: Kategori; jumlah: number }) =>
      buatTiketServer({ data: input }),
    onSuccess: (tiketBaru) => {
      setTiket(tiketBaru);
      queryClient.invalidateQueries({ queryKey: ["tiket"] });
    },
  });

  const total = HARGA[kategori] * jumlah;

  if (tiket) {
    return (
      <AppShell title="Tiket Berhasil Dibuat" subtitle="Minta pengunjung memfoto QR ini">
        <div className="kartu-farm overflow-hidden print:shadow-none">
          <div className="bg-primary px-4 py-3 text-center text-primary-foreground">
            <p className="font-display text-2xl font-black">TIKET MASUK</p>
          </div>
          <div className="flex flex-col items-center gap-4 p-5">
            <div className="rounded-2xl border-4 border-wood bg-background p-4">
              <QRCodeCanvas value={tiket.kode} size={240} level="M" includeMargin={false} />
            </div>
            <p className="font-display text-3xl font-black tracking-widest">{tiket.kode}</p>

            <dl className="w-full space-y-2 text-lg">
              <Baris label="Kategori" nilai={LABEL[tiket.kategori]} />
              <Baris label="Jumlah" nilai={`${tiket.jumlah} orang`} />
              <Baris label="Waktu beli" nilai={tanggalJam(tiket.dibuatPada)} />
              <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-3">
                <dt className="text-lg font-bold">Total bayar</dt>
                <dd className="font-display text-2xl font-black text-primary">
                  {rupiah(tiket.total)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-5 grid gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-2xl border-4 border-wood bg-card px-4 py-4 text-xl font-black text-wood-dark shadow-farm active:translate-y-0.5"
          >
            🖨️ Cetak Tiket
          </button>
          <button
            onClick={() => {
              setTiket(null);
              setJumlah(1);
            }}
            className="rounded-2xl bg-accent px-4 py-5 text-2xl font-black text-accent-foreground shadow-lift active:translate-y-0.5"
          >
            ➕ Transaksi Baru
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Loket Kasir" subtitle="Buat tiket masuk pengunjung">
      <div className="kartu-farm p-5">
        <p className="mb-3 text-lg font-black">Kategori Tiket</p>
        <div className="grid grid-cols-2 gap-3">
          {(["dewasa", "anak"] as Kategori[]).map((k) => {
            const aktif = kategori === k;
            return (
              <button
                key={k}
                onClick={() => setKategori(k)}
                className={`rounded-2xl border-4 px-3 py-5 text-center transition ${
                  aktif
                    ? "border-primary bg-primary text-primary-foreground shadow-lift"
                    : "border-border bg-background text-foreground"
                }`}
              >
                <span className="block text-4xl">{k === "dewasa" ? "🧑‍🌾" : "🧒"}</span>
                <span className="mt-1 block font-display text-2xl font-black">{LABEL[k]}</span>
                <span className="block text-base font-bold opacity-90">{rupiah(HARGA[k])}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 mb-3 text-lg font-black">Jumlah Tiket</p>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <button
            onClick={() => setJumlah((n) => Math.max(1, n - 1))}
            className="h-16 w-16 shrink-0 rounded-2xl bg-secondary text-3xl font-black text-secondary-foreground active:translate-y-0.5"
            aria-label="Kurangi"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={jumlah}
            onChange={(e) => setJumlah(Math.max(1, Number(e.target.value) || 1))}
            className="h-16 w-full rounded-2xl border-4 border-border bg-background text-center font-display text-3xl font-black"
          />
          <button
            onClick={() => setJumlah((n) => n + 1)}
            className="h-16 w-16 shrink-0 rounded-2xl bg-secondary text-3xl font-black text-secondary-foreground active:translate-y-0.5"
            aria-label="Tambah"
          >
            +
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-secondary px-4 py-4">
          <span className="text-xl font-black">Total</span>
          <span className="font-display text-3xl font-black text-primary">{rupiah(total)}</span>
        </div>
      </div>

      <button
        onClick={() => buatMutation.mutate({ kategori, jumlah })}
        disabled={buatMutation.isPending}
        className="mt-5 w-full rounded-2xl bg-accent px-4 py-6 font-display text-3xl font-black text-accent-foreground shadow-lift transition active:translate-y-0.5 disabled:opacity-60"
      >
        {buatMutation.isPending ? "Membuat..." : "Buat Tiket"}
      </button>

      {buatMutation.isError ? (
        <p className="mt-3 text-center font-bold text-destructive">
          Gagal membuat tiket. Cek koneksi lalu coba lagi.
        </p>
      ) : null}

      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        <Link to="/" className="text-sm font-bold text-muted-foreground underline">
          ← Kembali ke beranda
        </Link>
        <Link to="/admin/scan" className="text-sm font-bold text-muted-foreground underline">
          Masuk sebagai petugas/admin →
        </Link>
      </div>
    </AppShell>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-border pb-2">
      <dt className="font-bold text-muted-foreground">{label}</dt>
      <dd className="font-black">{nilai}</dd>
    </div>
  );
}
