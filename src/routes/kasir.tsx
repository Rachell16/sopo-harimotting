import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { AppShell } from "@/components/AppShell";
import { buatTiketServer, cekStatusTiket } from "@/lib/tickets.server";
import { ambilQris } from "@/lib/pengaturan.server";
import {
  HARGA,
  LABEL,
  rupiah,
  tanggalJam,
  formatNomorWa,
  type Kategori,
  type MetodeBayarTiket,
  type Tiket,
} from "@/lib/tickets";

export const Route = createFileRoute("/kasir")({
  head: () => ({
    meta: [
      { title: "Beli Tiket — Sopo Harimoting" },
      {
        name: "description",
        content: "Pesan tiket masuk Sopo Harimoting — bayar cash di kasir atau QRIS.",
      },
    ],
  }),
  component: KasirPage,
});

function KasirPage() {
  const navigate = useNavigate();
  const [namaPembeli, setNamaPembeli] = useState("");
  const [waNomor, setWaNomor] = useState("");
  const [kategori, setKategori] = useState<Kategori>("dewasa");
  const [jumlah, setJumlah] = useState(1);
  const [metode, setMetode] = useState<MetodeBayarTiket | null>(null);
  const [buktiTf, setBuktiTf] = useState<string | null>(null);
  const [pesanan, setPesanan] = useState<Tiket | null>(null);
  const [cariKode, setCariKode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: qris } = useQuery({
    queryKey: ["qris"],
    queryFn: () => ambilQris(),
    enabled: metode === "qris",
  });

  // Polling status pesanan — begitu petugas approve/tolak di admin, layar ini
  // otomatis update sendiri tanpa perlu refresh manual.
  const { data: statusTerbaru } = useQuery({
    queryKey: ["status-tiket", pesanan?.kode],
    queryFn: () => cekStatusTiket({ data: pesanan!.kode }),
    enabled: !!pesanan,
    refetchInterval: 3000,
  });
  const tiketTampil = statusTerbaru ?? pesanan;

  const buatMutation = useMutation({
    mutationFn: (input: {
      kategori: Kategori;
      jumlah: number;
      metode: MetodeBayarTiket;
      buktiTf: string | null;
      namaPembeli: string;
      waNomor: string;
    }) => buatTiketServer({ data: input }),
    onSuccess: (tiketBaru) => {
      setPesanan(tiketBaru);
      queryClient.invalidateQueries({ queryKey: ["tiket"] });
    },
  });

  function pilihFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBuktiTf(reader.result as string);
    reader.readAsDataURL(file);
  }

  const total = HARGA[kategori] * jumlah;
  const dataDiriLengkap = namaPembeli.trim().length > 1 && waNomor.replace(/\D/g, "").length >= 8;
  const siapKirim = dataDiriLengkap && (metode === "cash" || (metode === "qris" && !!buktiTf));

  // ---------- Layar status pesanan (setelah submit) ----------
  if (tiketTampil) {
    if (tiketTampil.status === "disetujui") {
      return (
        <AppShell title="Tiket Aktif!" subtitle="Tunjukkan QR ini di pintu masuk">
          <div className="kartu-farm overflow-hidden print:shadow-none">
            <div className="bg-primary px-4 py-3 text-center text-primary-foreground">
              <p className="font-display text-2xl font-black">TIKET MASUK</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-5">
              <div className="rounded-2xl border-4 border-wood bg-background p-4">
                <QRCodeCanvas value={tiketTampil.kode} size={240} level="M" includeMargin={false} />
              </div>
              <p className="font-display text-3xl font-black tracking-widest">{tiketTampil.kode}</p>
              <dl className="w-full space-y-2 text-lg">
                <Baris label="Kategori" nilai={LABEL[tiketTampil.kategori]} />
                <Baris label="Jumlah" nilai={`${tiketTampil.jumlah} orang`} />
                <Baris label="Waktu beli" nilai={tanggalJam(tiketTampil.dibuatPada)} />
                <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-3">
                  <dt className="text-lg font-bold">Total bayar</dt>
                  <dd className="font-display text-2xl font-black text-primary">
                    {rupiah(tiketTampil.total)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-5 grid gap-3 print:hidden">
            <p className="text-center text-sm font-bold text-muted-foreground">
              Takut kelupaan atau tab-nya ke-close? Kirim link tiket ini ke WhatsApp kamu:
            </p>
            <a
              href={`https://wa.me/${formatNomorWa(tiketTampil.waNomor)}?text=${encodeURIComponent(
                `Halo ${tiketTampil.namaPembeli}, ini tiket masuk Sopo Harimoting kamu: ${tiketTampil.kode}\n${typeof window !== "undefined" ? window.location.origin : ""}/tiket/${tiketTampil.kode}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-secondary px-4 py-4 text-center font-black text-secondary-foreground"
            >
              💬 Kirim ke WhatsApp
            </a>
            <button
              onClick={() => window.print()}
              className="rounded-2xl border-4 border-wood bg-card px-4 py-4 text-xl font-black text-wood-dark shadow-farm active:translate-y-0.5"
            >
              🖨️ Cetak Tiket
            </button>
            <button
              onClick={() => {
                setPesanan(null);
                setMetode(null);
                setBuktiTf(null);
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

    if (tiketTampil.status === "ditolak") {
      return (
        <AppShell title="Pesanan Ditolak" subtitle="Pembayaran tidak terverifikasi">
          <div className="kartu-farm p-6 text-center">
            <span className="text-5xl">❌</span>
            <p className="mt-3 font-display text-xl font-black">
              Pesanan {tiketTampil.kode} ditolak petugas
            </p>
            <p className="mt-1 text-muted-foreground">
              Kemungkinan pembayaran belum diterima atau bukti transfer kurang jelas. Coba pesan
              ulang atau tanya langsung ke petugas.
            </p>
          </div>
          <button
            onClick={() => {
              setPesanan(null);
              setMetode(null);
              setBuktiTf(null);
            }}
            className="mt-5 w-full rounded-2xl bg-accent px-4 py-5 text-center font-display text-xl font-black text-accent-foreground shadow-lift"
          >
            Pesan Ulang
          </button>
        </AppShell>
      );
    }

    // status === "menunggu"
    return (
      <AppShell title="Menunggu Konfirmasi" subtitle="Pesanan kamu sedang diverifikasi petugas">
        <div className="kartu-farm p-6 text-center">
          <span className="text-5xl">⏳</span>
          <p className="mt-3 font-display text-2xl font-black tracking-widest">{tiketTampil.kode}</p>
          <dl className="mt-4 space-y-2 text-left text-lg">
            <Baris label="Kategori" nilai={`${LABEL[tiketTampil.kategori]} × ${tiketTampil.jumlah}`} />
            <Baris label="Metode" nilai={tiketTampil.metode === "qris" ? "QRIS" : "Cash"} />
            <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-3">
              <dt className="text-lg font-bold">Total</dt>
              <dd className="font-display text-2xl font-black text-primary">
                {rupiah(tiketTampil.total)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm font-bold text-muted-foreground">
            {tiketTampil.metode === "cash"
              ? "Silakan bayar cash ke petugas kasir. Halaman ini otomatis update begitu dikonfirmasi."
              : "Bukti transfer sudah dikirim. Halaman ini otomatis update begitu petugas verifikasi."}
          </p>
        </div>

        <p className="mt-4 text-center text-sm font-bold text-muted-foreground">
          Kalau tab ini ke-close, simpan link ini buat balik ke sini lagi:
        </p>
        <a
          href={`https://wa.me/${formatNomorWa(tiketTampil.waNomor)}?text=${encodeURIComponent(
            `Halo ${tiketTampil.namaPembeli}, pesanan tiket Sopo Harimoting kamu: ${tiketTampil.kode}\n${typeof window !== "undefined" ? window.location.origin : ""}/tiket/${tiketTampil.kode}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block rounded-2xl bg-secondary px-4 py-4 text-center font-black text-secondary-foreground"
        >
          💬 Kirim ke WhatsApp
        </a>

        <button
          onClick={() => {
            setPesanan(null);
            setMetode(null);
            setBuktiTf(null);
          }}
          className="mt-4 w-full text-center text-sm font-bold text-muted-foreground underline"
        >
          ← Kembali / ubah pesanan
        </button>
      </AppShell>
    );
  }

  // ---------- Layar pilih tiket & bayar ----------
  return (
    <AppShell title="Beli Tiket" subtitle="Pesan tiket masuk pengunjung">
      <div className="kartu-farm p-5">
        <p className="mb-3 text-lg font-black">Data Diri</p>
        <label className="block text-sm font-bold text-muted-foreground">Nama Lengkap</label>
        <input
          value={namaPembeli}
          onChange={(e) => setNamaPembeli(e.target.value)}
          placeholder="Nama kamu"
          className="mt-1 h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg font-bold"
        />
        <label className="mt-3 block text-sm font-bold text-muted-foreground">Nomor WhatsApp</label>
        <input
          value={waNomor}
          onChange={(e) => setWaNomor(e.target.value.replace(/[^\d+]/g, ""))}
          inputMode="tel"
          placeholder="08xxxxxxxxxx"
          className="mt-1 h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg font-bold"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Dipakai buat kirim link tiket kamu ke WhatsApp & kalau petugas perlu menghubungi.
        </p>
      </div>

      <div className="kartu-farm mt-5 p-5">
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

        <p className="mt-6 mb-3 text-lg font-black">Metode Bayar</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setMetode("cash");
              setBuktiTf(null);
            }}
            className={`rounded-2xl border-4 px-3 py-4 text-center font-display text-lg font-black transition ${
              metode === "cash"
                ? "border-primary bg-primary text-primary-foreground shadow-lift"
                : "border-border bg-background text-foreground"
            }`}
          >
            💵 Cash
          </button>
          <button
            onClick={() => setMetode("qris")}
            className={`rounded-2xl border-4 px-3 py-4 text-center font-display text-lg font-black transition ${
              metode === "qris"
                ? "border-primary bg-primary text-primary-foreground shadow-lift"
                : "border-border bg-background text-foreground"
            }`}
          >
            📱 QRIS
          </button>
        </div>

        {metode === "cash" ? (
          <p className="mt-4 text-sm font-bold text-muted-foreground">
            Bayar cash langsung ke petugas kasir. Tiket aktif setelah petugas konfirmasi uang
            diterima.
          </p>
        ) : null}

        {metode === "qris" ? (
          <div className="mt-4">
            {qris ? (
              <img
                src={qris}
                alt="Kode QRIS"
                className="mx-auto h-52 w-52 rounded-2xl border-4 border-wood bg-white object-contain p-2"
              />
            ) : (
              <p className="text-center text-sm font-bold text-muted-foreground">
                QRIS belum tersedia, tanya petugas ya.
              </p>
            )}
            <p className="mt-3 text-center text-sm font-bold text-muted-foreground">
              Scan & bayar, lalu upload bukti transfernya di bawah ini.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pilihFile(e.target.files?.[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-3 w-full rounded-2xl bg-secondary px-4 py-4 text-center font-black text-secondary-foreground"
            >
              {buktiTf ? "✅ Bukti Transfer Terpilih" : "📁 Upload Bukti Transfer"}
            </button>
            {buktiTf ? (
              <img src={buktiTf} alt="Preview bukti transfer" className="mt-3 max-h-40 w-full rounded-xl object-contain" />
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        onClick={() =>
          metode && buatMutation.mutate({ kategori, jumlah, metode, buktiTf, namaPembeli: namaPembeli.trim(), waNomor: formatNomorWa(waNomor) })
        }
        disabled={!metode || !siapKirim || buatMutation.isPending}
        className="mt-5 w-full rounded-2xl bg-accent px-4 py-6 font-display text-2xl font-black text-accent-foreground shadow-lift transition active:translate-y-0.5 disabled:opacity-60"
      >
        {buatMutation.isPending
          ? "Mengirim..."
          : !dataDiriLengkap
            ? "Isi Nama & Nomor WA Dulu"
            : !metode
              ? "Pilih Metode Bayar Dulu"
              : metode === "qris" && !buktiTf
                ? "Upload Bukti Transfer Dulu"
                : "Kirim Pesanan"}
      </button>

      {buatMutation.isError ? (
        <p className="mt-3 text-center font-bold text-destructive">
          Gagal membuat pesanan. Cek koneksi lalu coba lagi.
        </p>
      ) : null}

      <div className="mt-8 kartu-farm p-4 text-center">
        <p className="mb-2 text-sm font-bold text-muted-foreground">Udah pernah pesan?</p>
        <div className="flex gap-2">
          <input
            value={cariKode}
            onChange={(e) => setCariKode(e.target.value)}
            placeholder="Masukkan kode tiket, misal WST-XXXXXX"
            className="h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-sm font-bold uppercase"
          />
          <button
            onClick={() => cariKode.trim() && navigate({ to: "/tiket/$kode", params: { kode: cariKode.trim() } })}
            disabled={!cariKode.trim()}
            className="h-12 shrink-0 rounded-xl bg-secondary px-4 text-sm font-black text-secondary-foreground disabled:opacity-50"
          >
            Cek
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <Link to="/" className="text-sm font-bold text-muted-foreground underline">
          ← Kembali ke beranda
        </Link>
        <Link to="/login" className="text-sm font-bold text-muted-foreground underline">
          Masuk sebagai petugas/admin/manager →
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
