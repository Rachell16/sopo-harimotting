import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MENU_MANAGER } from "@/lib/manager-menu";
import { jam } from "@/lib/tickets";
import { ambilAbsensi } from "@/lib/karyawan.server";
import { ambilKaryawan } from "@/lib/karyawan.server";
import { jamKerja, kelompokAbsensiPerTanggal } from "@/lib/karyawan";

export const Route = createFileRoute("/manager/absensi")({
  head: () => ({ meta: [{ title: "Absensi Karyawan — Sopo Harimoting" }] }),
  component: AbsensiPage,
});

function AbsensiPage() {
  const { data: absensi = [] } = useQuery({
    queryKey: ["absensi"],
    queryFn: () => ambilAbsensi(),
    refetchInterval: 5000,
  });
  const { data: karyawan = [] } = useQuery({ queryKey: ["karyawan"], queryFn: () => ambilKaryawan() });
  const [lihatFoto, setLihatFoto] = useState<string | null>(null);

  const namaKaryawan = useMemo(() => {
    const map = new Map(karyawan.map((k) => [k.kode, k.nama]));
    return (kode: string) => map.get(kode) ?? "(karyawan dihapus)";
  }, [karyawan]);

  const kelompok = useMemo(() => kelompokAbsensiPerTanggal(absensi), [absensi]);
  const masihDiLokasi = absensi.filter((a) => !a.keluar);

  return (
    <AppShell
      title="Absensi"
      subtitle="Riwayat kehadiran karyawan per tanggal"
      label="Sopo Harimoting · Manager"
      menu={MENU_MANAGER}
    >
      {masihDiLokasi.length > 0 ? (
        <div className="mb-5 rounded-2xl bg-success px-4 py-3 text-success-foreground shadow-farm">
          <p className="font-black">🟢 Masih di lokasi ({masihDiLokasi.length})</p>
          <p className="mt-1 text-sm">
            {masihDiLokasi.map((a) => namaKaryawan(a.karyawanKode)).join(", ")}
          </p>
        </div>
      ) : null}

      {kelompok.length === 0 ? (
        <p className="kartu-farm p-6 text-center text-lg font-bold text-muted-foreground">
          Belum ada riwayat absensi.
        </p>
      ) : (
        <div className="space-y-6">
          {kelompok.map((k) => (
            <div key={k.kunci}>
              <p className="mb-2 px-1 font-display text-lg font-black">{k.label}</p>
              <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
                {k.list.map((a) => (
                  <div key={a.kode} className="flex items-center gap-3 p-4">
                    <span className="shrink-0 text-2xl">{a.keluar ? "✅" : "🟢"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-black">{namaKaryawan(a.karyawanKode)}</p>
                      <p className="text-sm font-bold text-muted-foreground">
                        Masuk {jam(a.masuk)} {a.keluar ? `· Keluar ${jam(a.keluar)}` : "· masih di lokasi"}
                      </p>
                      <div className="mt-1 flex gap-2">
                        {a.fotoMasuk ? (
                          <button
                            onClick={() => setLihatFoto(a.fotoMasuk)}
                            className="text-xs font-bold text-primary underline"
                          >
                            📸 Foto masuk
                          </button>
                        ) : null}
                        {a.fotoKeluar ? (
                          <button
                            onClick={() => setLihatFoto(a.fotoKeluar)}
                            className="text-xs font-bold text-primary underline"
                          >
                            📸 Foto keluar
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-sm font-bold text-primary">
                      {jamKerja(a.masuk, a.keluar)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {lihatFoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setLihatFoto(null)}
        >
          <img
            src={lihatFoto}
            alt="Foto absen"
            className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
