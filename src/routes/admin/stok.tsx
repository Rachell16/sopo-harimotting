import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MENU_ADMIN } from "@/lib/admin-menu";
import { rupiah } from "@/lib/tickets";
import { ambilProduk, buatProduk, hapusProduk, updateProduk } from "@/lib/warung.server";
import type { Produk } from "@/lib/warung";

export const Route = createFileRoute("/admin/stok")({
  head: () => ({
    meta: [{ title: "Stok Jajanan — Sopo Harimoting" }],
  }),
  component: StokPage,
});

function StokPage() {
  const queryClient = useQueryClient();
  const { data: produk } = useQuery({
    queryKey: ["produk"],
    queryFn: () => ambilProduk(),
    refetchInterval: 5000,
  });

  const [form, setForm] = useState<{ kode: string | null; nama: string; harga: string; stok: string } | null>(
    null,
  );

  const simpanMutation = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const data = { nama: form.nama.trim(), harga: Number(form.harga) || 0, stok: Number(form.stok) || 0 };
      if (form.kode) {
        return updateProduk({ data: { kode: form.kode, ...data } });
      }
      return buatProduk({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produk"] });
      setForm(null);
    },
  });

  const hapusMutation = useMutation({
    mutationFn: (kode: string) => hapusProduk({ data: kode }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["produk"] }),
  });

  return (
    <AppShell
      title="Stok Jajanan"
      subtitle="Kelola produk yang dijual di warung"
      label="Sopo Harimoting · Admin"
      menu={MENU_ADMIN}
    >
      <button
        onClick={() => setForm({ kode: null, nama: "", harga: "", stok: "" })}
        className="mb-5 w-full rounded-2xl bg-accent px-4 py-4 text-center font-display text-xl font-black text-accent-foreground shadow-lift"
      >
        + Tambah Produk
      </button>

      {!produk || produk.length === 0 ? (
        <p className="kartu-farm p-6 text-center text-lg font-bold text-muted-foreground">
          Belum ada produk. Tambahin dulu yuk.
        </p>
      ) : (
        <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
          {produk.map((p: Produk) => (
            <div key={p.kode} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-black">{p.nama}</p>
                <p className="text-sm font-bold text-muted-foreground">
                  {rupiah(p.harga)} ·{" "}
                  <span className={p.stok === 0 ? "text-destructive" : ""}>Stok: {p.stok}</span>
                </p>
              </div>
              <button
                onClick={() =>
                  setForm({ kode: p.kode, nama: p.nama, harga: String(p.harga), stok: String(p.stok) })
                }
                className="shrink-0 rounded-xl bg-secondary px-3 py-2 text-sm font-black text-secondary-foreground"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Hapus "${p.nama}" dari daftar produk?`)) hapusMutation.mutate(p.kode);
                }}
                className="shrink-0 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-black text-destructive"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form tambah/edit — modal sederhana */}
      {form ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => setForm(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-2xl font-black">
              {form.kode ? "Edit Produk" : "Tambah Produk"}
            </p>

            <label className="mt-4 block text-sm font-bold text-muted-foreground">Nama produk</label>
            <input
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Contoh: Citato"
              className="mt-1 h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg font-bold"
              autoFocus
            />

            <label className="mt-4 block text-sm font-bold text-muted-foreground">Harga (Rp)</label>
            <input
              value={form.harga}
              onChange={(e) => setForm({ ...form, harga: e.target.value.replace(/\D/g, "") })}
              inputMode="numeric"
              placeholder="10000"
              className="mt-1 h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg font-bold"
            />

            <label className="mt-4 block text-sm font-bold text-muted-foreground">Stok</label>
            <input
              value={form.stok}
              onChange={(e) => setForm({ ...form, stok: e.target.value.replace(/\D/g, "") })}
              inputMode="numeric"
              placeholder="20"
              className="mt-1 h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg font-bold"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setForm(null)}
                className="flex-1 rounded-xl bg-secondary px-4 py-4 font-black text-secondary-foreground"
              >
                Batal
              </button>
              <button
                onClick={() => simpanMutation.mutate()}
                disabled={!form.nama.trim() || simpanMutation.isPending}
                className="flex-1 rounded-xl bg-accent px-4 py-4 font-black text-accent-foreground disabled:opacity-60"
              >
                {simpanMutation.isPending ? "..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
