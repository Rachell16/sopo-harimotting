import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MENU_ADMIN } from "@/lib/admin-menu";
import { rupiah } from "@/lib/tickets";
import { ambilProduk, prosesPenjualan } from "@/lib/warung.server";
import { ambilQris } from "@/lib/pengaturan.server";
import {
  totalKeranjang,
  type ItemKeranjang,
  type MetodeBayar,
  type Penjualan,
} from "@/lib/warung";

export const Route = createFileRoute("/admin/jual")({
  head: () => ({
    meta: [{ title: "Kasir Jajanan — Sopo Harimotting" }],
  }),
  component: JualPage,
});

function JualPage() {
  const queryClient = useQueryClient();
  const { data: produk } = useQuery({
    queryKey: ["produk"],
    queryFn: () => ambilProduk(),
    refetchInterval: 5000,
  });
  const { data: qris } = useQuery({
    queryKey: ["qris"],
    queryFn: () => ambilQris(),
  });

  const [keranjang, setKeranjang] = useState<ItemKeranjang[]>([]);
  const [struk, setStruk] = useState<Penjualan | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [modalQris, setModalQris] = useState(false);
  const [kategoriDipilih, setKategoriDipilih] = useState<string | null>(null);

  const bayarMutation = useMutation({
    mutationFn: (metode: MetodeBayar) =>
      prosesPenjualan({ data: { keranjang, metode } }),
    onSuccess: (hasil) => {
      setStruk(hasil);
      setKeranjang([]);
      setPesan(null);
      setModalQris(false);
      queryClient.invalidateQueries({ queryKey: ["produk"] });
    },
    onError: (err: any) => {
      setPesan(err?.message || "Gagal memproses penjualan.");
      setModalQris(false);
    },
  });

  function tambah(p: {
    kode: string;
    nama: string;
    harga: number;
    stok: number;
  }) {
    setKeranjang((list) => {
      const ada = list.find((i) => i.kode === p.kode);
      const qtySekarang = ada?.qty ?? 0;
      if (qtySekarang >= p.stok) return list;
      if (ada)
        return list.map((i) =>
          i.kode === p.kode ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...list, { kode: p.kode, nama: p.nama, harga: p.harga, qty: 1 }];
    });
  }

  function kurang(kode: string) {
    setKeranjang((list) =>
      list.flatMap((i) =>
        i.kode === kode ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i],
      ),
    );
  }

  if (struk) {
    return (
      <AppShell
        title="Transaksi Berhasil"
        subtitle="Struk penjualan"
        label="Sopo Harimotting · Admin"
        menu={MENU_ADMIN}
      >
        <div className="kartu-tiket p-6">
          <p className="text-center font-display text-2xl font-black">
            🧾 {struk.kode}
          </p>
          <p className="text-center text-sm font-bold text-muted-foreground">
            Dibayar via {struk.metode === "qris" ? "QRIS 📱" : "Cash 💵"}
          </p>
          <div className="my-4 divide-y-2 divide-dashed divide-border">
            {struk.item.map((i) => (
              <div
                key={i.kode}
                className="flex justify-between py-2 text-sm font-bold"
              >
                <span>
                  {i.nama} × {i.qty}
                </span>
                <span>{rupiah(i.harga * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t-2 border-border pt-3">
            <span className="font-display text-lg font-black">Total</span>
            <span className="font-display text-2xl font-black text-primary">
              {rupiah(struk.total)}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setStruk(null);
            setKategoriDipilih(null);
          }}
          className="mt-5 w-full rounded-2xl bg-accent px-4 py-5 text-center font-display text-xl font-black text-accent-foreground shadow-lift"
        >
          ➕ Transaksi Baru
        </button>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Kasir Jajanan"
      subtitle="Pilih barang yang dibeli"
      label="Sopo Harimotting · Admin"
      menu={MENU_ADMIN}
    >
      {!produk || produk.length === 0 ? (
        <p className="kartu-farm p-6 text-center text-lg font-bold text-muted-foreground">
          Belum ada produk.{" "}
          <Link to="/admin/stok" className="underline">
            Tambah produk dulu di halaman Stok
          </Link>
          .
        </p>
      ) : kategoriDipilih === null ? (
        // ---------- Langkah 1: pilih kategori ----------
        <div className="grid grid-cols-2 gap-3">
          {Array.from(new Set(produk.map((p) => p.kategori)))
            .sort()
            .map((kat) => {
              const jumlahProduk = produk.filter(
                (p) => p.kategori === kat,
              ).length;
              return (
                <button
                  key={kat}
                  onClick={() => setKategoriDipilih(kat)}
                  className="kartu-farm p-5 text-left transition active:scale-95 hover:-translate-y-1 hover:shadow-lift"
                >
                  <p className="font-display text-lg font-black">{kat}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {jumlahProduk} produk
                  </p>
                </button>
              );
            })}
        </div>
      ) : (
        // ---------- Langkah 2: pilih produk dalam kategori ----------
        <div>
          <button
            onClick={() => setKategoriDipilih(null)}
            className="mb-4 text-sm font-bold text-muted-foreground underline"
          >
            ← Ganti kategori
          </button>
          <p className="mb-3 font-display text-xl font-black">
            {kategoriDipilih}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {produk
              .filter((p) => p.kategori === kategoriDipilih)
              .map((p) => {
                const diKeranjang =
                  keranjang.find((i) => i.kode === p.kode)?.qty ?? 0;
                const habis = p.stok === 0 || diKeranjang >= p.stok;
                return (
                  <button
                    key={p.kode}
                    onClick={() => tambah(p)}
                    disabled={habis}
                    className="kartu-farm relative p-4 text-left transition active:scale-95 disabled:opacity-40"
                  >
                    {diKeranjang > 0 ? (
                      <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent font-black text-accent-foreground shadow">
                        {diKeranjang}
                      </span>
                    ) : null}
                    <p className="font-display text-base font-black">
                      {p.nama}
                    </p>
                    <p className="mt-1 text-sm font-bold text-primary">
                      {rupiah(p.harga)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {habis && p.stok === 0
                        ? "Stok habis"
                        : `Stok: ${p.stok - diKeranjang}`}
                    </p>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Keranjang — nempel di bawah, di atas nav */}
      {keranjang.length > 0 ? (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t-4 border-wood bg-card/97 p-4 shadow-lift backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 max-h-28 space-y-1 overflow-y-auto">
              {keranjang.map((i) => (
                <div
                  key={i.kode}
                  className="flex items-center justify-between text-sm font-bold"
                >
                  <span className="truncate">
                    {i.nama} × {i.qty}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span>{rupiah(i.harga * i.qty)}</span>
                    <button
                      onClick={() => kurang(i.kode)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
                    >
                      −
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {pesan ? (
              <p className="mb-2 text-sm font-bold text-destructive">{pesan}</p>
            ) : null}

            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm font-bold text-muted-foreground">
                Total
              </span>
              <span className="font-display text-2xl font-black text-primary">
                {rupiah(totalKeranjang(keranjang))}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => bayarMutation.mutate("cash")}
                disabled={bayarMutation.isPending}
                className="flex-1 rounded-2xl bg-secondary px-4 py-4 font-display text-lg font-black text-secondary-foreground disabled:opacity-60"
              >
                {bayarMutation.isPending ? "..." : "💵 Cash"}
              </button>
              <button
                onClick={() => setModalQris(true)}
                disabled={bayarMutation.isPending}
                className="flex-1 rounded-2xl bg-accent px-4 py-4 font-display text-lg font-black text-accent-foreground shadow-lift disabled:opacity-60"
              >
                📱 QRIS
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Pop-up QRIS */}
      {modalQris ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setModalQris(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-xl font-black">
              Scan QRIS untuk Bayar
            </p>
            <p className="mt-1 font-display text-2xl font-black text-primary">
              {rupiah(totalKeranjang(keranjang))}
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
                className="flex-1 rounded-xl bg-secondary px-4 py-4 font-black text-secondary-foreground"
              >
                Batal
              </button>
              <button
                onClick={() => bayarMutation.mutate("qris")}
                disabled={bayarMutation.isPending || !qris}
                className="flex-1 rounded-xl bg-accent px-4 py-4 font-black text-accent-foreground disabled:opacity-60"
              >
                {bayarMutation.isPending ? "..." : "✅ Sudah Dibayar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
