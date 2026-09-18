import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MENU_ADMIN } from "@/lib/admin-menu";
import { useTiketList } from "@/hooks/useTiket";
import { jam, kelompokPerTanggal, LABEL, rupiah } from "@/lib/tickets";
import { ambilPenjualan } from "@/lib/warung.server";
import { kelompokPenjualanPerTanggal } from "@/lib/warung";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/laporan")({
  head: () => ({
    meta: [
      { title: "Laporan — Sopo Harimotting" },
      {
        name: "description",
        content:
          "Riwayat transaksi tiket & jajanan per tanggal, lengkap dengan subtotal harian.",
      },
    ],
  }),
  component: LaporanPage,
});

const FILTER = [
  { id: "7", label: "7 Hari" },
  { id: "30", label: "30 Hari" },
  { id: "semua", label: "Semua" },
] as const;

const TAB = [
  { id: "tiket", label: "🎟️ Tiket" },
  { id: "jajanan", label: "🛍️ Jajanan" },
] as const;

function LaporanPage() {
  const semuaTiket = useTiketList();
  const { data: semuaJajanan = [] } = useQuery({
    queryKey: ["penjualan"],
    queryFn: () => ambilPenjualan(),
    refetchInterval: 5000,
  });

  const [filter, setFilter] = useState<(typeof FILTER)[number]["id"]>("7");
  const [tab, setTab] = useState<(typeof TAB)[number]["id"]>("tiket");

  const batasWaktu = useMemo(() => {
    if (filter === "semua") return null;
    const batas = new Date();
    batas.setDate(batas.getDate() - Number(filter));
    batas.setHours(0, 0, 0, 0);
    return batas;
  }, [filter]);

  const tiket = useMemo(() => {
    const disetujui = semuaTiket.filter((t) => t.status === "disetujui");
    return batasWaktu
      ? disetujui.filter((t) => new Date(t.dibuatPada) >= batasWaktu)
      : disetujui;
  }, [semuaTiket, batasWaktu]);
  const jajanan = useMemo(
    () =>
      batasWaktu
        ? semuaJajanan.filter((p) => new Date(p.waktu) >= batasWaktu)
        : semuaJajanan,
    [semuaJajanan, batasWaktu],
  );

  const kelompokTiket = useMemo(() => kelompokPerTanggal(tiket), [tiket]);
  const kelompokJajanan = useMemo(
    () => kelompokPenjualanPerTanggal(jajanan),
    [jajanan],
  );

  const totalTiketUang = tiket.reduce((a, t) => a + t.total, 0);
  const totalJajananUang = jajanan.reduce((a, p) => a + p.total, 0);
  const totalGabungan = totalTiketUang + totalJajananUang;
  const jumlahMenunggu = semuaTiket.filter(
    (t) => t.status === "menunggu",
  ).length;

  return (
    <AppShell
      title="Laporan"
      subtitle="Riwayat transaksi, tersusun per tanggal"
      label="Sopo Harimotting · Admin"
      menu={MENU_ADMIN}
    >
      {jumlahMenunggu > 0 ? (
        <Link
          to="/admin/verifikasi"
          className="mb-4 flex items-center justify-between rounded-2xl bg-accent px-4 py-3 font-black text-accent-foreground shadow-farm"
        >
          <span>⏳ {jumlahMenunggu} pesanan menunggu verifikasi</span>
          <span>Cek →</span>
        </Link>
      ) : null}

      {/* Ringkasan gabungan — kayak "saldo" di mbanking, cuma yang udah disetujui */}
      <div className="panel-kayu rounded-2xl p-5 text-center shadow-lift">
        <p className="text-sm font-bold uppercase tracking-wide opacity-75">
          Total Pendapatan · {FILTER.find((f) => f.id === filter)?.label}
        </p>
        <p className="mt-1 font-display text-4xl font-black">
          {rupiah(totalGabungan)}
        </p>
        <div className="mt-2 flex justify-center gap-4 text-sm opacity-85">
          <span>🎟️ Tiket: {rupiah(totalTiketUang)}</span>
          <span>🛍️ Jajanan: {rupiah(totalJajananUang)}</span>
        </div>
      </div>

      {/* Filter periode */}
      <div className="mt-4 flex gap-2">
        {FILTER.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-black transition ${
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tab Tiket / Jajanan */}
      <div className="mt-5 flex gap-2 border-b-2 border-border">
        {TAB.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 pb-3 text-center font-display text-base font-black transition ${
              tab === t.id
                ? "border-b-4 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Riwayat per tanggal — gaya mutasi mbanking */}
      <div className="mt-6">
        {tab === "tiket" ? (
          kelompokTiket.length === 0 ? (
            <p className="kartu-farm p-6 text-center text-lg font-bold text-muted-foreground">
              Belum ada transaksi tiket di periode ini.
            </p>
          ) : (
            <div className="space-y-6">
              {kelompokTiket.map((k) => (
                <div key={k.kunci}>
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <p className="font-display text-lg font-black">{k.label}</p>
                    <p className="text-sm font-bold text-muted-foreground">
                      {k.totalTiket} tiket · {rupiah(k.totalUang)}
                    </p>
                  </div>
                  <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
                    {k.list.map((t) => (
                      <div key={t.kode} className="flex items-center gap-3 p-4">
                        <span className="shrink-0 text-2xl">
                          {t.kategori === "dewasa" ? "🧑‍🌾" : "🧒"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-lg font-black">
                            {t.kode}
                          </p>
                          <p className="text-sm font-bold text-muted-foreground">
                            {LABEL[t.kategori]} · {t.jumlah} orang ·{" "}
                            {jam(t.dibuatPada)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-display font-black text-primary">
                            +{rupiah(t.total)}
                          </p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-black ${
                              t.dipakaiPada
                                ? "bg-secondary text-secondary-foreground"
                                : "bg-accent text-accent-foreground"
                            }`}
                          >
                            {t.dipakaiPada ? "Sudah masuk" : "Belum dipakai"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : kelompokJajanan.length === 0 ? (
          <p className="kartu-farm p-6 text-center text-lg font-bold text-muted-foreground">
            Belum ada transaksi jajanan di periode ini.
          </p>
        ) : (
          <div className="space-y-6">
            {kelompokJajanan.map((k) => (
              <div key={k.kunci}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <p className="font-display text-lg font-black">{k.label}</p>
                  <p className="text-sm font-bold text-muted-foreground">
                    {k.totalItem} item · {rupiah(k.totalUang)}
                  </p>
                </div>
                <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
                  {k.list.map((p) => (
                    <div key={p.kode} className="flex items-center gap-3 p-4">
                      <span className="shrink-0 text-2xl">
                        {p.metode === "qris" ? "📱" : "💵"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-lg font-black">
                          {p.kode}
                        </p>
                        <p className="truncate text-sm font-bold text-muted-foreground">
                          {p.item.map((i) => `${i.nama}×${i.qty}`).join(", ")} ·{" "}
                          {jam(p.waktu)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display font-black text-primary">
                          +{rupiah(p.total)}
                        </p>
                        <span className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-black text-secondary-foreground">
                          {p.metode === "qris" ? "QRIS" : "Cash"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
