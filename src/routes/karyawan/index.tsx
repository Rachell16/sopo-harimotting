import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { absenDenganKode, ambilAbsensiKaryawan } from "@/lib/karyawan.server";
import { jam } from "@/lib/tickets";
import { jamKerja, kelompokAbsensiPerTanggal } from "@/lib/karyawan";

export const Route = createFileRoute("/karyawan/")({
  head: () => ({ meta: [{ title: "Dashboard Absensi — Sopo Harimoting" }] }),
  component: DashboardKaryawan,
});

function DashboardKaryawan() {
  const [sesi, setSesi] = useState<{ kode: string; nama: string } | null>(null);
  const [modalFoto, setModalFoto] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [lihatFoto, setLihatFoto] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const raw = sessionStorage.getItem("karyawan-sesi");
    setSesi(raw ? JSON.parse(raw) : null);
  }, []);

  const { data: riwayat = [] } = useQuery({
    queryKey: ["absensi-saya", sesi?.kode],
    queryFn: () => ambilAbsensiKaryawan({ data: sesi!.kode }),
    enabled: !!sesi,
    refetchInterval: 5000,
  });

  const absenMutation = useMutation({
    mutationFn: () => absenDenganKode({ data: { kode: sesi!.kode, foto: foto! } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absensi-saya", sesi?.kode] });
      setModalFoto(false);
      setFoto(null);
    },
  });

  function pilihFoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (!sesi) return null;

  const sesiTerbuka = riwayat.find((a) => !a.keluar);
  const kelompok = kelompokAbsensiPerTanggal(riwayat);
  const aksiBerikutnya = sesiTerbuka ? "keluar" : "masuk";

  return (
    <AppShell title={`Halo, ${sesi.nama}`} subtitle="Dashboard absensi kamu">
      {/* Status hari ini */}
      <div className={`panel-kayu rounded-2xl p-5 text-center shadow-lift`}>
        {sesiTerbuka ? (
          <>
            <p className="text-sm font-bold uppercase tracking-wide opacity-75">Status</p>
            <p className="mt-1 font-display text-2xl font-black">🟢 Sedang bekerja</p>
            <p className="mt-1 text-sm opacity-85">Absen masuk pukul {jam(sesiTerbuka.masuk)}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold uppercase tracking-wide opacity-75">Status</p>
            <p className="mt-1 font-display text-2xl font-black">⚪ Belum absen</p>
            <p className="mt-1 text-sm opacity-85">
              {riwayat[0] ? `Terakhir: ${jam(riwayat[0].masuk)} - ${riwayat[0].keluar ? jam(riwayat[0].keluar) : "-"}` : "Belum pernah absen"}
            </p>
          </>
        )}
      </div>

      <button
        onClick={() => setModalFoto(true)}
        className="mt-4 w-full rounded-2xl bg-accent px-4 py-5 text-center font-display text-xl font-black text-accent-foreground shadow-lift"
      >
        {aksiBerikutnya === "masuk" ? "✅ Absen Masuk" : "👋 Absen Keluar"}
      </button>

      {/* Riwayat pribadi */}
      <div className="mt-8">
        <p className="mb-3 font-display text-xl font-black">Riwayat Absensi Saya</p>
        {kelompok.length === 0 ? (
          <p className="kartu-farm p-6 text-center text-sm font-bold text-muted-foreground">
            Belum ada riwayat.
          </p>
        ) : (
          <div className="space-y-6">
            {kelompok.map((k) => (
              <div key={k.kunci}>
                <p className="mb-2 px-1 font-display text-base font-black">{k.label}</p>
                <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
                  {k.list.map((a) => (
                    <div key={a.kode} className="flex items-center gap-3 p-4">
                      <span className="shrink-0 text-2xl">{a.keluar ? "✅" : "🟢"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">
                          Masuk {jam(a.masuk)} {a.keluar ? `· Keluar ${jam(a.keluar)}` : "· masih berlangsung"}
                        </p>
                        <div className="mt-1 flex gap-2">
                          {a.fotoMasuk ? (
                            <button onClick={() => setLihatFoto(a.fotoMasuk)} className="text-xs font-bold text-primary underline">
                              📸 Foto masuk
                            </button>
                          ) : null}
                          {a.fotoKeluar ? (
                            <button onClick={() => setLihatFoto(a.fotoKeluar)} className="text-xs font-bold text-primary underline">
                              📸 Foto keluar
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <p className="shrink-0 text-right text-xs font-bold text-primary">{jamKerja(a.masuk, a.keluar)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal ambil foto sebelum absen */}
      {modalFoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !absenMutation.isPending && setModalFoto(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-xl font-black">
              {aksiBerikutnya === "masuk" ? "Absen Masuk" : "Absen Keluar"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Ambil foto dulu sebagai bukti kamu di lokasi.</p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => pilihFoto(e.target.files?.[0])}
            />

            {foto ? (
              <img src={foto} alt="Preview foto" className="mt-4 w-full rounded-2xl border-4 border-wood object-cover" />
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-4 w-full rounded-2xl border-4 border-dashed border-wood/40 bg-secondary/60 px-4 py-8"
              >
                <span className="block text-4xl">📸</span>
                <span className="mt-2 block font-black text-secondary-foreground">Ambil / Upload Foto</span>
              </button>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setModalFoto(false)}
                disabled={absenMutation.isPending}
                className="flex-1 rounded-xl bg-secondary px-4 py-4 font-black text-secondary-foreground disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={() => foto && absenMutation.mutate()}
                disabled={!foto || absenMutation.isPending}
                className="flex-1 rounded-xl bg-accent px-4 py-4 font-black text-accent-foreground disabled:opacity-60"
              >
                {absenMutation.isPending ? "..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lightbox foto riwayat */}
      {lihatFoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setLihatFoto(null)}
        >
          <img src={lihatFoto} alt="Foto absen" className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl" />
        </div>
      ) : null}
    </AppShell>
  );
}
