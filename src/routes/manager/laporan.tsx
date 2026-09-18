import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { MENU_MANAGER } from "@/lib/manager-menu";
import { useTiketList } from "@/hooks/useTiket";
import { jam, kelompokPerTanggal, rupiah, LABEL } from "@/lib/tickets";
import { ambilPenjualan, ambilProduk } from "@/lib/warung.server";
import { kelompokPenjualanPerTanggal } from "@/lib/warung";
import { ambilAbsensi, ambilKaryawan } from "@/lib/karyawan.server";
import {
  ambilPengeluaran,
  tambahPengeluaran,
  hapusPengeluaran,
} from "@/lib/pengeluaran.server";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unduhExcel } from "@/lib/excel";
import {
  breakdownKategoriTiket,
  buatRekomendasiLokal,
  kunjunganPerHariMinggu,
  produkTerlaris,
  stokMenipis,
} from "@/lib/analitik";

export const Route = createFileRoute("/manager/laporan")({
  head: () => ({ meta: [{ title: "Laporan Keuangan — Sopo Harimotting" }] }),
  component: LaporanManagerPage,
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

function labelTgl(kunci: string) {
  const [, b, c] = kunci.split("-");
  return `${c}/${b}`;
}

function LaporanManagerPage() {
  const queryClient = useQueryClient();
  const semuaTiket = useTiketList();
  const { data: semuaJajanan = [] } = useQuery({
    queryKey: ["penjualan"],
    queryFn: () => ambilPenjualan(),
  });
  const { data: semuaAbsensi = [] } = useQuery({
    queryKey: ["absensi"],
    queryFn: () => ambilAbsensi(),
  });
  const { data: semuaKaryawan = [] } = useQuery({
    queryKey: ["karyawan"],
    queryFn: () => ambilKaryawan(),
  });
  const { data: semuaPengeluaran = [] } = useQuery({
    queryKey: ["pengeluaran"],
    queryFn: () => ambilPengeluaran(),
  });
  const { data: produk = [] } = useQuery({
    queryKey: ["produk"],
    queryFn: () => ambilProduk(),
  });

  const [filter, setFilter] = useState<(typeof FILTER)[number]["id"]>("7");
  const [keteranganBaru, setKeteranganBaru] = useState("");
  const [jumlahBaru, setJumlahBaru] = useState("");

  const batasWaktu = useMemo(() => {
    if (filter === "semua") return null;
    const b = new Date();
    b.setDate(b.getDate() - Number(filter));
    b.setHours(0, 0, 0, 0);
    return b;
  }, [filter]);

  const dalamPeriode = (iso: string) =>
    !batasWaktu || new Date(iso) >= batasWaktu;

  const tiket = useMemo(
    () =>
      semuaTiket.filter(
        (t) => t.status === "disetujui" && dalamPeriode(t.dibuatPada),
      ),
    [semuaTiket, batasWaktu],
  );
  const jajanan = useMemo(
    () => semuaJajanan.filter((p) => dalamPeriode(p.waktu)),
    [semuaJajanan, batasWaktu],
  );
  const absensi = useMemo(
    () => semuaAbsensi.filter((a) => dalamPeriode(a.masuk)),
    [semuaAbsensi, batasWaktu],
  );
  const pengeluaran = useMemo(
    () => semuaPengeluaran.filter((p) => dalamPeriode(p.dibuatPada)),
    [semuaPengeluaran, batasWaktu],
  );

  const kelompokTiket = useMemo(() => kelompokPerTanggal(tiket), [tiket]);
  const kelompokJajanan = useMemo(
    () => kelompokPenjualanPerTanggal(jajanan),
    [jajanan],
  );

  const totalTiket = tiket.reduce((a, t) => a + t.total, 0);
  const totalJajanan = jajanan.reduce((a, p) => a + p.total, 0);
  const totalPendapatan = totalTiket + totalJajanan;

  // Rekap gaji: hari kerja unik (berdasarkan tanggal absen masuk) × gaji harian.
  const rekapGaji = useMemo(() => {
    return semuaKaryawan.map((k) => {
      const milikDia = absensi.filter((a) => a.karyawanKode === k.kode);
      const hariUnik = new Set(
        milikDia.map((a) => new Date(a.masuk).toDateString()),
      );
      const hariKerja = hariUnik.size;
      return {
        nama: k.nama,
        hariKerja,
        gajiHarian: k.gajiHarian,
        total: hariKerja * k.gajiHarian,
      };
    });
  }, [semuaKaryawan, absensi]);
  const totalGaji = rekapGaji.reduce((a, g) => a + g.total, 0);
  const totalPengeluaranLain = pengeluaran.reduce((a, p) => a + p.jumlah, 0);
  const totalPengeluaran = totalGaji + totalPengeluaranLain;
  const labaRugi = totalPendapatan - totalPengeluaran;
  const jumlahMenunggu = semuaTiket.filter(
    (t) => t.status === "menunggu",
  ).length;

  // Filter tambahan: kunjungan bisa difilter per kategori tiket, produk terlaris
  // bisa difilter per kategori jajanan — gak ngubah Total Pendapatan/Laba-Rugi
  // (itu tetap angka utuh seluruh bisnis), cuma nyaring 2 section analitik ini aja.
  const [filterKategoriTiket, setFilterKategoriTiket] = useState<
    "semua" | "dewasa" | "anak"
  >("semua");
  const [filterKategoriJajanan, setFilterKategoriJajanan] =
    useState<string>("semua");
  const [tab, setTab] = useState<(typeof TAB)[number]["id"]>("tiket");

  const tiketUntukKunjungan = useMemo(
    () =>
      filterKategoriTiket === "semua"
        ? tiket
        : tiket.filter((t) => t.kategori === filterKategoriTiket),
    [tiket, filterKategoriTiket],
  );

  const kategoriJajananList = useMemo(
    () => Array.from(new Set(produk.map((p) => p.kategori))).sort(),
    [produk],
  );
  const produkKategoriMap = useMemo(
    () => new Map(produk.map((p) => [p.kode, p.kategori])),
    [produk],
  );
  const jajananUntukTerlaris = useMemo(() => {
    if (filterKategoriJajanan === "semua") return jajanan;
    return jajanan
      .map((p) => ({
        ...p,
        item: p.item.filter(
          (i) => produkKategoriMap.get(i.kode) === filterKategoriJajanan,
        ),
      }))
      .filter((p) => p.item.length > 0);
  }, [jajanan, filterKategoriJajanan, produkKategoriMap]);

  // Sama kayak jajananUntukTerlaris, tapi total-nya diitung ulang dari item yang
  // ke-filter aja (bukan total transaksi utuh) — biar angka yang ditampilkan di
  // riwayat harian konsisten sama item yang keliatan.
  const jajananUntukRiwayat = useMemo(() => {
    if (filterKategoriJajanan === "semua") return jajanan;
    return jajananUntukTerlaris.map((p) => ({
      ...p,
      total: p.item.reduce((a, i) => a + i.harga * i.qty, 0),
    }));
  }, [jajanan, jajananUntukTerlaris, filterKategoriJajanan]);

  const kelompokTiketRiwayat = useMemo(
    () => kelompokPerTanggal(tiketUntukKunjungan),
    [tiketUntukKunjungan],
  );
  const kelompokJajananRiwayat = useMemo(
    () => kelompokPenjualanPerTanggal(jajananUntukRiwayat),
    [jajananUntukRiwayat],
  );

  // Analitik: pola kunjungan, produk terlaris, breakdown tiket, stok menipis.
  const kunjunganHari = useMemo(
    () => kunjunganPerHariMinggu(tiketUntukKunjungan),
    [tiketUntukKunjungan],
  );
  const hariRamai = useMemo(
    () => [...kunjunganHari].sort((a, b) => b.jumlah - a.jumlah)[0],
    [kunjunganHari],
  );
  const terlaris = useMemo(
    () => produkTerlaris(jajananUntukTerlaris, 5),
    [jajananUntukTerlaris],
  );
  const breakdownTiket = useMemo(() => breakdownKategoriTiket(tiket), [tiket]);
  const menipis = useMemo(() => stokMenipis(produk, 5), [produk]);

  // Rekomendasi tetap dari data UTUH (bukan yang difilter) biar gambarannya lengkap.
  const kunjunganHariUtuh = useMemo(
    () => kunjunganPerHariMinggu(tiket),
    [tiket],
  );
  const terlarisUtuh = useMemo(() => produkTerlaris(jajanan, 5), [jajanan]);
  const rekomendasiList = useMemo(
    () =>
      buatRekomendasiLokal({
        kunjunganHari: kunjunganHariUtuh,
        terlaris: terlarisUtuh,
        menipis,
        labaRugi,
        totalPendapatan,
      }),
    [kunjunganHariUtuh, terlarisUtuh, menipis, labaRugi, totalPendapatan],
  );

  // Data grafik — gabungan pendapatan tiket + jajanan per tanggal, urut lama ke baru.
  const grafik = useMemo(() => {
    const map = new Map<string, number>();
    for (const k of kelompokTiket)
      map.set(k.kunci, (map.get(k.kunci) ?? 0) + k.totalUang);
    for (const k of kelompokJajanan)
      map.set(k.kunci, (map.get(k.kunci) ?? 0) + k.totalUang);
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([kunci, pendapatan]) => ({ tanggal: labelTgl(kunci), pendapatan }));
  }, [kelompokTiket, kelompokJajanan]);

  const tambahMutation = useMutation({
    mutationFn: () =>
      tambahPengeluaran({
        data: {
          keterangan: keteranganBaru.trim(),
          jumlah: Number(jumlahBaru) || 0,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengeluaran"] });
      setKeteranganBaru("");
      setJumlahBaru("");
    },
  });
  const hapusMutation = useMutation({
    mutationFn: (kode: string) => hapusPengeluaran({ data: kode }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["pengeluaran"] }),
  });

  function eksporExcel() {
    unduhExcel(
      `laporan-sopo-harimoting-${FILTER.find((f) => f.id === filter)?.label}`,
      [
        {
          nama: "Pendapatan Tiket",
          data: tiket.map((t) => ({
            Kode: t.kode,
            Kategori: t.kategori,
            Jumlah: t.jumlah,
            Total: t.total,
            Metode: t.metode,
            Waktu: new Date(t.dibuatPada).toLocaleString("id-ID"),
          })),
        },
        {
          nama: "Pendapatan Jajanan",
          data: jajanan.map((p) => ({
            Kode: p.kode,
            Item: p.item.map((i) => `${i.nama}x${i.qty}`).join(", "),
            Total: p.total,
            Metode: p.metode,
            Waktu: new Date(p.waktu).toLocaleString("id-ID"),
          })),
        },
        {
          nama: "Gaji Karyawan",
          data: rekapGaji.map((g) => ({
            Nama: g.nama,
            "Hari Kerja": g.hariKerja,
            "Gaji Harian": g.gajiHarian,
            "Total Gaji": g.total,
          })),
        },
        {
          nama: "Pengeluaran Lain",
          data: pengeluaran.map((p) => ({
            Keterangan: p.keterangan,
            Jumlah: p.jumlah,
            Tanggal: new Date(p.dibuatPada).toLocaleString("id-ID"),
          })),
        },
        {
          nama: "Breakdown Tiket",
          data: breakdownTiket.map((b) => ({
            Kategori: LABEL[b.kategori],
            "Jumlah Pengunjung": b.jumlah,
            Pendapatan: b.pendapatan,
          })),
        },
        {
          nama: "Produk Terlaris",
          data: terlaris.map((t) => ({
            Produk: t.nama,
            "Qty Terjual": t.qty,
            Pendapatan: t.total,
          })),
        },
        {
          nama: "Kunjungan per Hari",
          data: kunjunganHari.map((h) => ({
            Hari: h.hari,
            "Jumlah Pengunjung": h.jumlah,
            Pendapatan: h.pendapatan,
          })),
        },
        {
          nama: "Stok Menipis",
          data: menipis.map((p) => ({
            Produk: p.nama,
            Kategori: p.kategori,
            "Sisa Stok": p.stok,
          })),
        },
        {
          nama: "Ringkasan",
          data: [
            { Item: "Pendapatan Tiket", Jumlah: totalTiket },
            { Item: "Pendapatan Jajanan", Jumlah: totalJajanan },
            { Item: "Total Pendapatan", Jumlah: totalPendapatan },
            { Item: "Total Gaji Karyawan", Jumlah: totalGaji },
            { Item: "Total Pengeluaran Lain", Jumlah: totalPengeluaranLain },
            { Item: "Total Pengeluaran", Jumlah: totalPengeluaran },
            { Item: "Laba/Rugi", Jumlah: labaRugi },
          ],
        },
      ],
    );
  }

  return (
    <AppShell
      title="Laporan Keuangan"
      subtitle="Pendapatan, gaji, pengeluaran & laba-rugi"
      label="Sopo Harimotting · Manager"
      menu={MENU_MANAGER}
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

      {/* Filter periode */}
      <div className="flex gap-2">
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

      {/* Ringkasan laba-rugi */}
      <div className="panel-kayu mt-4 rounded-2xl p-5 text-center shadow-lift">
        <p className="text-sm font-bold uppercase tracking-wide opacity-75">
          Laba / Rugi
        </p>
        <p
          className={`mt-1 font-display text-4xl font-black ${labaRugi < 0 ? "text-destructive" : ""}`}
        >
          {labaRugi < 0 ? "-" : ""}
          {rupiah(Math.abs(labaRugi))}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-left text-sm opacity-90">
          <div>
            <p className="opacity-70">Pendapatan</p>
            <p className="font-black">{rupiah(totalPendapatan)}</p>
          </div>
          <div>
            <p className="opacity-70">Pengeluaran</p>
            <p className="font-black">{rupiah(totalPengeluaran)}</p>
          </div>
        </div>
      </div>

      <button
        onClick={eksporExcel}
        className="mt-4 w-full rounded-2xl bg-accent px-4 py-4 text-center font-display text-lg font-black text-accent-foreground shadow-lift"
      >
        📥 Ekspor ke Excel
      </button>

      {/* Grafik tren pendapatan */}
      <div className="kartu-farm mt-6 p-4">
        <p className="mb-3 font-display text-xl font-black">Tren Pendapatan</p>
        {grafik.length === 0 ? (
          <p className="py-8 text-center text-sm font-bold text-muted-foreground">
            Belum ada data di periode ini.
          </p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={grafik}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.84 0.03 80)"
                />
                <XAxis dataKey="tanggal" fontSize={12} />
                <YAxis
                  fontSize={11}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  width={40}
                />
                <Tooltip formatter={(v: number) => rupiah(v)} />
                <Line
                  type="monotone"
                  dataKey="pendapatan"
                  stroke="oklch(0.32 0.07 155)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Rekomendasi */}
      <div className="kartu-tiket mt-6 p-5">
        <p className="font-display text-xl font-black">💡 Rekomendasi</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Otomatis dari pola kunjungan, stok, dan produk terlaris di periode
          ini.
        </p>

        {rekomendasiList.length === 0 ? (
          <p className="mt-4 text-sm font-bold text-muted-foreground">
            Belum cukup data buat kasih rekomendasi.
          </p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {rekomendasiList.map((poin, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm font-bold text-foreground"
              >
                <span className="shrink-0 text-primary">•</span>
                <span>{poin}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Kunjungan per hari — buat lihat hari mana paling ramai (ngikut filter kategori tiket di atas) */}
      <div className="kartu-farm mt-6 p-4">
        <p className="font-display text-xl font-black">Kunjungan per Hari</p>
        {hariRamai && hariRamai.jumlah > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Paling ramai:{" "}
            <span className="font-black text-foreground">{hariRamai.hari}</span>{" "}
            ({hariRamai.jumlah} pengunjung)
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Belum ada data kunjungan di periode ini.
          </p>
        )}
        <div className="mt-3 h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kunjunganHari}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.84 0.03 80)"
              />
              <XAxis
                dataKey="hari"
                fontSize={11}
                tickFormatter={(h: string) => h.slice(0, 3)}
              />
              <YAxis fontSize={11} width={30} allowDecimals={false} />
              <Tooltip formatter={(v: number) => `${v} orang`} />
              <Bar
                dataKey="jumlah"
                fill="oklch(0.74 0.14 75)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Riwayat transaksi — gaya admin, tapi ada filter kategori */}
      <div className="mt-6">
        <p className="mb-3 font-display text-xl font-black">
          Riwayat Transaksi
        </p>

        <div className="flex gap-2 border-b-2 border-border">
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

        {/* Filter kategori — beda tiap tab */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tab === "tiket" ? (
            (["semua", "dewasa", "anak"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilterKategoriTiket(k)}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  filterKategoriTiket === k
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {k === "semua" ? "Semua" : LABEL[k]}
              </button>
            ))
          ) : (
            <>
              <button
                onClick={() => setFilterKategoriJajanan("semua")}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  filterKategoriJajanan === "semua"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                Semua
              </button>
              {kategoriJajananList.map((k) => (
                <button
                  key={k}
                  onClick={() => setFilterKategoriJajanan(k)}
                  className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                    filterKategoriJajanan === k
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {k}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="mt-4">
          {tab === "tiket" ? (
            kelompokTiketRiwayat.length === 0 ? (
              <p className="kartu-farm p-6 text-center text-lg font-bold text-muted-foreground">
                Belum ada transaksi tiket
                {filterKategoriTiket !== "semua"
                  ? ` kategori ${LABEL[filterKategoriTiket]}`
                  : ""}{" "}
                di periode ini.
              </p>
            ) : (
              <div className="space-y-6">
                {kelompokTiketRiwayat.map((k) => (
                  <div key={k.kunci}>
                    <div className="mb-2 flex items-baseline justify-between px-1">
                      <p className="font-display text-lg font-black">
                        {k.label}
                      </p>
                      <p className="text-sm font-bold text-muted-foreground">
                        {k.totalTiket} tiket · {rupiah(k.totalUang)}
                      </p>
                    </div>
                    <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
                      {k.list.map((t) => (
                        <div
                          key={t.kode}
                          className="flex items-center gap-3 p-4"
                        >
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
          ) : kelompokJajananRiwayat.length === 0 ? (
            <p className="kartu-farm p-6 text-center text-lg font-bold text-muted-foreground">
              Belum ada transaksi jajanan
              {filterKategoriJajanan !== "semua"
                ? ` kategori "${filterKategoriJajanan}"`
                : ""}{" "}
              di periode ini.
            </p>
          ) : (
            <div className="space-y-6">
              {kelompokJajananRiwayat.map((k) => (
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
                            {p.item.map((i) => `${i.nama}×${i.qty}`).join(", ")}{" "}
                            · {jam(p.waktu)}
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
      </div>

      {/* Produk terlaris — ngikut filter kategori jajanan di atas */}
      <div className="mt-6">
        <p className="mb-3 font-display text-xl font-black">
          🏆 Produk Terlaris
        </p>
        {terlaris.length === 0 ? (
          <p className="kartu-farm p-5 text-center text-sm font-bold text-muted-foreground">
            Belum ada penjualan jajanan
            {filterKategoriJajanan !== "semua"
              ? ` di kategori "${filterKategoriJajanan}"`
              : ""}{" "}
            di periode ini.
          </p>
        ) : (
          <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
            {terlaris.map((t, i) => (
              <div key={t.nama} className="flex items-center gap-3 p-4">
                <span className="w-6 shrink-0 text-center font-display text-lg font-black text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{t.nama}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.qty} terjual
                  </p>
                </div>
                <p className="shrink-0 font-display font-black text-primary">
                  {rupiah(t.total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stok menipis */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-xl font-black">⚠️ Stok Menipis</p>
          <Link
            to="/admin/stok"
            className="text-sm font-bold text-primary underline"
          >
            Ke halaman Stok →
          </Link>
        </div>
        {menipis.length === 0 ? (
          <p className="kartu-farm p-5 text-center text-sm font-bold text-muted-foreground">
            Semua stok masih aman (di atas 5) 👍
          </p>
        ) : (
          <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
            {menipis.map((p) => (
              <div
                key={p.kode}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-black">{p.nama}</p>
                  <p className="text-sm text-muted-foreground">{p.kategori}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-black ${
                    p.stok === 0
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent/20 text-accent-foreground"
                  }`}
                >
                  {p.stok === 0 ? "Habis" : `Sisa ${p.stok}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rekap gaji */}
      <div className="mt-6">
        <p className="mb-3 font-display text-xl font-black">
          Rekap Gaji Karyawan
        </p>
        {rekapGaji.length === 0 ? (
          <p className="kartu-farm p-5 text-center text-sm font-bold text-muted-foreground">
            Belum ada data karyawan.
          </p>
        ) : (
          <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
            {rekapGaji.map((g) => (
              <div
                key={g.nama}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-display font-black">{g.nama}</p>
                  <p className="text-sm text-muted-foreground">
                    {g.hariKerja} hari kerja × {rupiah(g.gajiHarian)}
                  </p>
                </div>
                <p className="font-display text-lg font-black text-primary">
                  {rupiah(g.total)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between bg-secondary p-4">
              <p className="font-black text-secondary-foreground">Total Gaji</p>
              <p className="font-display text-lg font-black text-secondary-foreground">
                {rupiah(totalGaji)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pengeluaran lain-lain */}
      <div className="mt-6">
        <p className="mb-3 font-display text-xl font-black">Pengeluaran Lain</p>
        <div className="kartu-farm p-4">
          <div className="flex gap-2">
            <input
              value={keteranganBaru}
              onChange={(e) => setKeteranganBaru(e.target.value)}
              placeholder="Keterangan, misal: Beli pakan kuda"
              className="h-12 flex-1 rounded-xl border-2 border-border bg-background px-3 text-sm font-bold"
            />
            <input
              value={jumlahBaru}
              onChange={(e) => setJumlahBaru(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="Rp"
              className="h-12 w-28 rounded-xl border-2 border-border bg-background px-3 text-sm font-bold"
            />
          </div>
          <button
            onClick={() => tambahMutation.mutate()}
            disabled={
              !keteranganBaru.trim() || !jumlahBaru || tambahMutation.isPending
            }
            className="mt-3 w-full rounded-xl bg-secondary px-4 py-3 font-black text-secondary-foreground disabled:opacity-50"
          >
            + Catat Pengeluaran
          </button>
        </div>

        {pengeluaran.length > 0 ? (
          <div className="kartu-farm mt-3 divide-y-2 divide-dashed divide-border overflow-hidden">
            {pengeluaran.map((p) => (
              <div
                key={p.kode}
                className="flex items-center justify-between p-3"
              >
                <div>
                  <p className="font-bold">{p.keterangan}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.dibuatPada).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-black text-destructive">
                    -{rupiah(p.jumlah)}
                  </p>
                  <button
                    onClick={() => hapusMutation.mutate(p.kode)}
                    className="text-xs font-bold text-muted-foreground underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
