import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { cekStatusTiket } from "@/lib/tickets.server";
import { LABEL, rupiah, tanggalJam } from "@/lib/tickets";

export const Route = createFileRoute("/tiket/$kode")({
  head: ({ params }) => ({
    meta: [{ title: `Tiket ${params.kode} — Sopo Harimoting` }],
  }),
  component: CekTiketPage,
});

function CekTiketPage() {
  const { kode } = useParams({ from: "/tiket/$kode" });
  const { data: tiket, isLoading } = useQuery({
    queryKey: ["status-tiket", kode],
    queryFn: () => cekStatusTiket({ data: kode }),
    refetchInterval: (query) => (query.state.data?.status === "menunggu" ? 3000 : false),
  });

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/70">
          Sopo Harimoting
        </p>
        <h1 className="mt-1 font-display text-3xl font-black">Cek Tiket</h1>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Memuat...</p>
      ) : !tiket ? (
        <div className="kartu-farm p-6 text-center">
          <span className="text-5xl">❓</span>
          <p className="mt-3 font-display text-xl font-black">Tiket tidak ditemukan</p>
          <p className="mt-1 text-muted-foreground">
            Kode <span className="font-black">{kode}</span> gak terdaftar. Cek lagi kode-nya.
          </p>
        </div>
      ) : tiket.status === "disetujui" ? (
        <div className="kartu-farm overflow-hidden">
          <div className="bg-primary px-4 py-3 text-center text-primary-foreground">
            <p className="font-display text-2xl font-black">TIKET MASUK</p>
          </div>
          <div className="flex flex-col items-center gap-4 p-5">
            <div className="rounded-2xl border-4 border-wood bg-background p-4">
              <QRCodeCanvas value={tiket.kode} size={220} level="M" includeMargin={false} />
            </div>
            <p className="font-display text-2xl font-black tracking-widest">{tiket.kode}</p>
            <dl className="w-full space-y-2 text-base">
              <div className="flex justify-between border-b border-dashed border-border pb-2">
                <dt className="font-bold text-muted-foreground">Kategori</dt>
                <dd className="font-black">
                  {LABEL[tiket.kategori]} × {tiket.jumlah}
                </dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-border pb-2">
                <dt className="font-bold text-muted-foreground">Waktu beli</dt>
                <dd className="font-black">{tanggalJam(tiket.dibuatPada)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-3">
                <dt className="font-bold">Total</dt>
                <dd className="font-display text-xl font-black text-primary">{rupiah(tiket.total)}</dd>
              </div>
            </dl>
            {tiket.dipakaiPada ? (
              <p className="text-sm font-bold text-muted-foreground">
                Tiket ini sudah dipakai masuk pada {tanggalJam(tiket.dipakaiPada)}.
              </p>
            ) : (
              <p className="text-center text-sm font-bold text-muted-foreground">
                Tunjukkan QR ini ke petugas di pintu masuk.
              </p>
            )}
          </div>
        </div>
      ) : tiket.status === "menunggu" ? (
        <div className="kartu-farm p-6 text-center">
          <span className="text-5xl">⏳</span>
          <p className="mt-3 font-display text-xl font-black">Menunggu Konfirmasi</p>
          <p className="mt-1 text-muted-foreground">
            Pesanan {tiket.kode} masih diverifikasi petugas. Halaman ini auto-update sendiri.
          </p>
        </div>
      ) : (
        <div className="kartu-farm p-6 text-center">
          <span className="text-5xl">❌</span>
          <p className="mt-3 font-display text-xl font-black">Pesanan Ditolak</p>
          <p className="mt-1 text-muted-foreground">
            Pesanan {tiket.kode} ditolak petugas. Silakan pesan ulang atau tanya ke petugas.
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/" className="text-sm font-bold text-muted-foreground underline">
          ← Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
