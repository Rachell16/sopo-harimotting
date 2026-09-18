import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/AppShell";
import { MENU_ADMIN } from "@/lib/admin-menu";
import { rupiah } from "@/lib/tickets";
import { ambilProduk, buatProduk, hapusProduk, importProdukMassal, updateProduk } from "@/lib/warung.server";
import type { Produk } from "@/lib/warung";

export const Route = createFileRoute("/admin/stok")({
  head: () => ({
    meta: [{ title: "Stok Jajanan — Sopo Harimoting" }],
  }),
  component: StokPage,
});

type BarisImpor = { nama: string; kategori: string; harga: number; stok: number };

function StokPage() {
  const queryClient = useQueryClient();
  const { data: produk } = useQuery({
    queryKey: ["produk"],
    queryFn: () => ambilProduk(),
    refetchInterval: 5000,
  });

  const [form, setForm] = useState<{
    kode: string | null;
    nama: string;
    kategori: string;
    harga: string;
    stok: string;
  } | null>(null);

  const daftarKategori = Array.from(new Set((produk ?? []).map((p) => p.kategori))).sort();
  const [pratinjauImpor, setPratinjauImpor] = useState<BarisImpor[] | null>(null);
  const [pesanImporError, setPesanImporError] = useState<string | null>(null);
  const fileImporRef = useRef<HTMLInputElement>(null);

  const simpanMutation = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const data = {
        nama: form.nama.trim(),
        kategori: form.kategori.trim() || "Lainnya",
        harga: Number(form.harga) || 0,
        stok: Number(form.stok) || 0,
      };
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

  const importMutation = useMutation({
    mutationFn: (items: BarisImpor[]) => importProdukMassal({ data: items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produk"] });
      setPratinjauImpor(null);
    },
  });

  function bacaFileExcel(file: File | undefined) {
    if (!file) return;
    setPesanImporError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]!];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const hasil: BarisImpor[] = rows
          .map((r) => {
            const nama = String(r.Nama ?? r.nama ?? "").trim();
            const kategori = String(r.Kategori ?? r.kategori ?? "").trim() || "Lainnya";
            const harga = Number(r.Harga ?? r.harga ?? 0) || 0;
            const stok = Number(r.Stok ?? r.stok ?? 0) || 0;
            return { nama, kategori, harga, stok };
          })
          .filter((r) => r.nama.length > 0);

        if (hasil.length === 0) {
          setPesanImporError('Gak nemu data valid. Pastikan ada kolom "Nama" (wajib), "Kategori", "Harga", "Stok".');
          return;
        }
        setPratinjauImpor(hasil);
      } catch {
        setPesanImporError("Gagal baca file. Pastikan formatnya .xlsx atau .csv.");
      }
    };
    reader.readAsBinaryString(file);
  }

  return (
    <AppShell
      title="Stok Jajanan"
      subtitle="Kelola produk yang dijual di warung"
      label="Sopo Harimoting · Admin"
      menu={MENU_ADMIN}
    >
      <div className="mb-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => setForm({ kode: null, nama: "", kategori: "", harga: "", stok: "" })}
          className="rounded-2xl bg-accent px-4 py-4 text-center font-display text-lg font-black text-accent-foreground shadow-lift"
        >
          + Tambah
        </button>
        <button
          onClick={() => fileImporRef.current?.click()}
          className="rounded-2xl bg-secondary px-4 py-4 text-center font-display text-lg font-black text-secondary-foreground"
        >
          📥 Import Excel
        </button>
        <input
          ref={fileImporRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => bacaFileExcel(e.target.files?.[0])}
        />
      </div>

      {pesanImporError ? (
        <p className="mb-4 kartu-farm p-3 text-center text-sm font-bold text-destructive">{pesanImporError}</p>
      ) : null}

      {!produk || produk.length === 0 ? (
        <p className="kartu-farm p-6 text-center text-lg font-bold text-muted-foreground">
          Belum ada produk. Tambahin dulu yuk, satu-satu atau sekalian import Excel.
        </p>
      ) : (
        <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
          {produk.map((p: Produk) => (
            <div key={p.kode} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-black">{p.nama}</p>
                <p className="text-sm font-bold text-muted-foreground">
                  {p.kategori} · {rupiah(p.harga)} ·{" "}
                  <span className={p.stok === 0 ? "text-destructive" : ""}>Stok: {p.stok}</span>
                </p>
              </div>
              <button
                onClick={() =>
                  setForm({ kode: p.kode, nama: p.nama, kategori: p.kategori, harga: String(p.harga), stok: String(p.stok) })
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

            <label className="mt-4 block text-sm font-bold text-muted-foreground">Kategori</label>
            <input
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              placeholder="Contoh: Minuman, Snack, Mie Instan"
              list="daftar-kategori"
              className="mt-1 h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg font-bold"
            />
            <datalist id="daftar-kategori">
              {daftarKategori.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>

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

      {/* Pratinjau import Excel sebelum beneran masuk */}
      {pratinjauImpor ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => !importMutation.isPending && setPratinjauImpor(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-2xl font-black">Pratinjau Import</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ketemu <span className="font-black text-foreground">{pratinjauImpor.length} produk</span> di
              file. Cek dulu sebelum beneran ditambahin.
            </p>

            <div className="mt-4 max-h-64 space-y-1 overflow-y-auto rounded-xl border-2 border-border p-2">
              {pratinjauImpor.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate font-bold">{r.nama}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {rupiah(r.harga)} · stok {r.stok}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setPratinjauImpor(null)}
                disabled={importMutation.isPending}
                className="flex-1 rounded-xl bg-secondary px-4 py-4 font-black text-secondary-foreground disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={() => importMutation.mutate(pratinjauImpor)}
                disabled={importMutation.isPending}
                className="flex-1 rounded-xl bg-accent px-4 py-4 font-black text-accent-foreground disabled:opacity-60"
              >
                {importMutation.isPending ? "Mengimpor..." : `Import ${pratinjauImpor.length} Produk`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
