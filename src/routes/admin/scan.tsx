import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MENU_ADMIN } from "@/lib/admin-menu";
import { useTiketList } from "@/hooks/useTiket";
import { validasiTiketServer } from "@/lib/tickets.server";
import {
  LABEL,
  pengunjungMasukHariIni,
  rupiah,
  tanggalJam,
  type HasilScan,
} from "@/lib/tickets";

export const Route = createFileRoute("/admin/scan")({
  head: () => ({
    meta: [
      { title: "Scan Tiket Pintu Masuk — Sopo Harimotting" },
      {
        name: "description",
        content:
          "Pindai QR code tiket pengunjung di pintu masuk dan lihat hasil validasi secara langsung.",
      },
      {
        property: "og:title",
        content: "Scan Tiket Pintu Masuk — Sopo Harimotting",
      },
      {
        property: "og:description",
        content:
          "Validasi tiket pengunjung lewat kamera HP atau tablet petugas.",
      },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const list = useTiketList();
  const queryClient = useQueryClient();
  const [hasil, setHasil] = useState<HasilScan | null>(null);
  const [kameraAktif, setKameraAktif] = useState(false);
  const [memvalidasi, setMemvalidasi] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);

  async function prosesKode(kode: string) {
    setMemvalidasi(true);
    setPesan(null);
    try {
      const hasilScan = await validasiTiketServer({ data: kode });
      setHasil(hasilScan);
      queryClient.invalidateQueries({ queryKey: ["tiket"] });
    } catch {
      setPesan("Gagal menghubungi server. Cek koneksi lalu coba lagi.");
    } finally {
      setMemvalidasi(false);
    }
  }

  useEffect(() => {
    if (!kameraAktif) return;
    let batal = false;
    let instance: any = null;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (batal) return;
        instance = new Html5Qrcode("area-kamera");
        scannerRef.current = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (teks: string) => {
            setKameraAktif(false);
            void prosesKode(teks);
          },
          () => {},
        );
      } catch {
        if (!batal) {
          setPesan(
            "Kamera tidak bisa dibuka. Gunakan input kode manual di bawah.",
          );
          setKameraAktif(false);
        }
      }
    })();

    return () => {
      batal = true;
      const s = scannerRef.current as any;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [kameraAktif]);

  const masuk = pengunjungMasukHariIni(list);

  return (
    <AppShell
      title="Pintu Masuk"
      subtitle="Arahkan kamera ke QR tiket pengunjung"
      label="Sopo Harimotting · Admin"
      menu={MENU_ADMIN}
    >
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-farm">
        <span className="text-base font-bold">Pengunjung masuk hari ini</span>
        <span className="font-display text-3xl font-black">{masuk}</span>
      </div>

      {hasil ? (
        <HasilPanel hasil={hasil} onLanjut={() => setHasil(null)} />
      ) : memvalidasi ? (
        <div className="kartu-farm flex min-h-56 items-center justify-center p-6">
          <p className="text-lg font-bold text-muted-foreground">
            Memeriksa tiket...
          </p>
        </div>
      ) : (
        <div className="kartu-farm p-4">
          <div
            id="area-kamera"
            className="mb-4 min-h-56 overflow-hidden rounded-2xl border-4 border-wood bg-wood-dark/90"
          >
            {!kameraAktif && (
              <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center text-cream">
                <span className="text-5xl">📷</span>
                <p className="text-lg font-bold">Kamera belum aktif</p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setPesan(null);
              setKameraAktif((v) => !v);
            }}
            className="w-full rounded-2xl bg-accent px-4 py-5 font-display text-2xl font-black text-accent-foreground shadow-lift active:translate-y-0.5"
          >
            {kameraAktif ? "Hentikan Kamera" : "Buka Kamera & Scan"}
          </button>

          {pesan ? (
            <p className="mt-3 text-center font-bold text-destructive">
              {pesan}
            </p>
          ) : null}

          <div className="mt-6 border-t-2 border-dashed border-border pt-4">
            <p className="mb-2 text-base font-black">Atau ketik kode tiket</p>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="WST-XXXXXX"
                className="h-14 w-full rounded-xl border-4 border-border bg-background px-3 text-lg font-black uppercase"
              />
              <button
                onClick={() => {
                  if (!manual.trim() || memvalidasi) return;
                  void prosesKode(manual);
                  setManual("");
                }}
                disabled={memvalidasi}
                className="h-14 shrink-0 rounded-xl bg-primary px-5 text-lg font-black text-primary-foreground disabled:opacity-60"
              >
                {memvalidasi ? "..." : "Cek"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function HasilPanel({
  hasil,
  onLanjut,
}: {
  hasil: HasilScan;
  onLanjut: () => void;
}) {
  const valid = hasil.status === "valid";
  const peringatan = hasil.status === "belum-disetujui";
  const judul =
    hasil.status === "valid"
      ? "BOLEH MASUK"
      : hasil.status === "terpakai"
        ? "TIKET SUDAH DIGUNAKAN"
        : hasil.status === "belum-disetujui"
          ? "PEMBAYARAN BELUM DIVERIFIKASI"
          : hasil.status === "ditolak"
            ? "PESANAN DITOLAK"
            : "TIKET TIDAK DITEMUKAN";

  return (
    <div className="space-y-4">
      <div
        className={`rounded-3xl px-4 py-10 text-center shadow-lift ${
          valid
            ? "bg-success text-success-foreground"
            : peringatan
              ? "bg-accent text-accent-foreground"
              : "bg-destructive text-destructive-foreground"
        }`}
      >
        <span className="text-7xl">
          {valid ? "✅" : peringatan ? "⏳" : "⛔"}
        </span>
        <p className="mt-3 font-display text-4xl leading-tight font-black">
          {judul}
        </p>
        {peringatan ? (
          <p className="mt-2 text-base font-bold opacity-90">
            Cek & setujui dulu di halaman Verifikasi sebelum tiket ini bisa
            dipakai masuk.
          </p>
        ) : null}
      </div>

      <div className="kartu-farm p-5 text-lg">
        {"tiket" in hasil ? (
          <dl className="space-y-2">
            <Baris label="Kode tiket" nilai={hasil.tiket.kode} />
            <Baris label="Kategori" nilai={LABEL[hasil.tiket.kategori]} />
            <Baris label="Jumlah" nilai={`${hasil.tiket.jumlah} orang`} />
            <Baris label="Harga" nilai={rupiah(hasil.tiket.total)} />
            <Baris
              label="Waktu beli"
              nilai={tanggalJam(hasil.tiket.dibuatPada)}
            />
            {hasil.tiket.dipakaiPada ? (
              <Baris
                label="Dipakai"
                nilai={tanggalJam(hasil.tiket.dipakaiPada)}
              />
            ) : null}
          </dl>
        ) : (
          <p className="text-center font-bold">
            Kode <span className="font-black">{hasil.kode}</span> tidak
            terdaftar di sistem.
          </p>
        )}
      </div>

      <button
        onClick={onLanjut}
        className="w-full rounded-2xl bg-accent px-4 py-5 font-display text-2xl font-black text-accent-foreground shadow-lift active:translate-y-0.5"
      >
        Scan Berikutnya
      </button>
    </div>
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
