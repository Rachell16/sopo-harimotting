import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { AppShell } from "@/components/AppShell";
import { MENU_ADMIN } from "@/lib/admin-menu";
import { buatTiketAdmin } from "@/lib/tickets.server";
import { ambilQris } from "@/lib/pengaturan.server";
import {
  HARGA,
  LABEL,
  rupiah,
  tanggalJam,
  type Kategori,
  type MetodeBayarTiket,
  type Tiket,
} from "@/lib/tickets";

export const Route = createFileRoute("/admin/kasir")({
  head: () => ({
    meta: [{ title: "Kasir Tiket — Sopo Harimotting" }],
  }),
  component: KasirAdminPage,
});

function KasirAdminPage() {
  const queryClient = useQueryClient();
  const [kategori, setKategori] = useState<Kategori>("dewasa");
  const [jumlah, setJumlah] = useState(1);
  const [namaPembeli, setNamaPembeli] = useState("");
  const [waNomor, setWaNomor] = useState("");
  const [tiket, setTiket] = useState<Tiket | null>(null);
  const [modalQris, setModalQris] = useState(false);

  const { data: qris } = useQuery({
    queryKey: ["qris"],
    queryFn: () => ambilQris(),
    enabled: modalQris,
  });

  const buatMutation = useMutation({
    mutationFn: (data: {
      kategori: Kategori;
      jumlah: number;
      metode: MetodeBayarTiket;
      namaPembeli: string;
      waNomor: string;
    }) => buatTiketAdmin({ data }),
    onSuccess: (t) => {
      setTiket(t);
      setModalQris(false);
      queryClient.invalidateQueries({ queryKey: ["tiket"] });
    },
  });

  const total = HARGA[kategori] * jumlah;

  if (tiket) {
    return (
      <AppShell
        title="Tiket Aktif!"
        subtitle="Langsung bisa dipakai masuk"
        label="Sopo Harimotting · Admin"
        menu={MENU_ADMIN}
      >
        <div className="kartu-farm overflow-hidden print:shadow-none">
          <div className="bg-primary px-4 py-3 text-center text-primary-foreground">
            <p className="font-display text-2xl font-black">TIKET MASUK</p>
          </div>
          <div className="flex flex-col items-center gap-4 p-5">
            <div className="rounded-2xl border-4 border-wood bg-background p-4">
              <QRCodeCanvas
                value={tiket.kode}
                size={240}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="font-display text-3xl font-black tracking-widest">
              {tiket.kode}
            </p>
            <dl className="w-full space-y-2 text-lg">
              <div className="flex items-center justify-between border-b border-dashed border-border pb-2">
                <dt className="font-bold text-muted-foreground">Kategori</dt>
                <dd className="font-black">
                  {LABEL[tiket.kategori]} × {tiket.jumlah}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-border pb-2">
                <dt className="font-bold text-muted-foreground">Metode</dt>
                <dd className="font-black">
                  {tiket.metode === "qris" ? "QRIS" : "Cash"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-border pb-2">
                <dt className="font-bold text-muted-foreground">Waktu</dt>
                <dd className="font-black">{tanggalJam(tiket.dibuatPada)}</dd>
              </div>
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
              setNamaPembeli("");
              setWaNomor("");
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
    <AppShell
      title="Kasir Tiket"
      subtitle="Buat tiket langsung untuk pengunjung di loket"
      label="Sopo Harimotting · Admin"
      menu={MENU_ADMIN}
    >
      <p className="kartu-farm mb-5 p-3 text-center text-sm font-bold text-muted-foreground">
        Buat khusus pengunjung yang beli langsung di loket (gak online). Tiket
        langsung aktif, gak perlu lewat Verifikasi.
      </p>

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
                <span className="block text-4xl">
                  {k === "dewasa" ? "🧑‍🌾" : "🧒"}
                </span>
                <span className="mt-1 block font-display text-2xl font-black">
                  {LABEL[k]}
                </span>
                <span className="block text-base font-bold opacity-90">
                  {rupiah(HARGA[k])}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 mb-3 text-lg font-black">Jumlah Tiket</p>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <button
            onClick={() => setJumlah((n) => Math.max(1, n - 1))}
            className="h-16 w-16 shrink-0 rounded-2xl bg-secondary text-3xl font-black text-secondary-foreground active:translate-y-0.5"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={jumlah}
            onChange={(e) =>
              setJumlah(Math.max(1, Number(e.target.value) || 1))
            }
            className="h-16 w-full rounded-2xl border-4 border-border bg-background text-center font-display text-3xl font-black"
          />
          <button
            onClick={() => setJumlah((n) => n + 1)}
            className="h-16 w-16 shrink-0 rounded-2xl bg-secondary text-3xl font-black text-secondary-foreground active:translate-y-0.5"
          >
            +
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-secondary px-4 py-4">
          <span className="text-xl font-black">Total</span>
          <span className="font-display text-3xl font-black text-primary">
            {rupiah(total)}
          </span>
        </div>

        <p className="mt-6 mb-1 text-sm font-bold text-muted-foreground">
          Nama pembeli (opsional)
        </p>
        <input
          value={namaPembeli}
          onChange={(e) => setNamaPembeli(e.target.value)}
          placeholder="Kosongkan kalau gak perlu"
          className="h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base font-bold"
        />
        <p className="mt-3 mb-1 text-sm font-bold text-muted-foreground">
          Nomor WA (opsional)
        </p>
        <input
          value={waNomor}
          onChange={(e) => setWaNomor(e.target.value.replace(/[^\d+]/g, ""))}
          inputMode="tel"
          placeholder="Isi kalau pengunjung mau dikirimin link tiket"
          className="h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base font-bold"
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={() =>
            buatMutation.mutate({
              kategori,
              jumlah,
              metode: "cash",
              namaPembeli,
              waNomor,
            })
          }
          disabled={buatMutation.isPending}
          className="rounded-2xl bg-secondary px-4 py-5 text-center font-display text-xl font-black text-secondary-foreground disabled:opacity-60"
        >
          {buatMutation.isPending ? "..." : "💵 Bayar Cash"}
        </button>
        <button
          onClick={() => setModalQris(true)}
          disabled={buatMutation.isPending}
          className="rounded-2xl bg-accent px-4 py-5 text-center font-display text-xl font-black text-accent-foreground shadow-lift disabled:opacity-60"
        >
          📱 Bayar QRIS
        </button>
      </div>

      {buatMutation.isError ? (
        <p className="mt-3 text-center font-bold text-destructive">
          Gagal membuat tiket. Coba lagi.
        </p>
      ) : null}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Cash langsung bikin tiket. QRIS nunjukin kode dulu, tiket baru dibuat
        setelah kamu konfirmasi pengunjung udah bayar.
      </p>

      <div className="mt-6 text-center">
        <Link
          to="/admin/verifikasi"
          className="text-sm font-bold text-muted-foreground underline"
        >
          Lihat pesanan online yang menunggu →
        </Link>
      </div>

      {/* Pop-up QRIS */}
      {modalQris ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !buatMutation.isPending && setModalQris(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-xl font-black">
              Scan QRIS untuk Bayar
            </p>
            <p className="mt-1 font-display text-2xl font-black text-primary">
              {rupiah(total)}
            </p>

            {qris ? (
              <img
                src={qris}
                alt="Kode QRIS"
                className="mx-auto mt-4 h-56 w-56 rounded-2xl border-4 border-wood bg-white object-contain p-2"
              />
            ) : (
              <div className="mt-4">
                <p className="text-sm font-bold text-muted-foreground">
                  QRIS belum di-upload. Upload dulu di halaman Pengaturan.
                </p>
                <Link
                  to="/admin/pengaturan"
                  className="mt-3 inline-block rounded-xl bg-secondary px-4 py-2 text-sm font-black text-secondary-foreground"
                >
                  ⚙️ Ke Pengaturan
                </Link>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setModalQris(false)}
                disabled={buatMutation.isPending}
                className="flex-1 rounded-xl bg-secondary px-4 py-4 font-black text-secondary-foreground disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  buatMutation.mutate({
                    kategori,
                    jumlah,
                    metode: "qris",
                    namaPembeli,
                    waNomor,
                  })
                }
                disabled={buatMutation.isPending || !qris}
                className="flex-1 rounded-xl bg-accent px-4 py-4 font-black text-accent-foreground disabled:opacity-60"
              >
                {buatMutation.isPending ? "..." : "✅ Sudah Dibayar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
