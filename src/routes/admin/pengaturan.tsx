import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MENU_ADMIN } from "@/lib/admin-menu";
import { ambilQris, hapusQris, simpanQris } from "@/lib/pengaturan.server";

export const Route = createFileRoute("/admin/pengaturan")({
  head: () => ({
    meta: [{ title: "Pengaturan — Sopo Harimoting" }],
  }),
  component: PengaturanPage,
});

function PengaturanPage() {
  const queryClient = useQueryClient();
  const { data: qris } = useQuery({ queryKey: ["qris"], queryFn: () => ambilQris() });
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const simpanMutation = useMutation({
    mutationFn: (dataUrl: string) => simpanQris({ data: dataUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qris"] });
      setPreview(null);
    },
  });

  const hapusMutation = useMutation({
    mutationFn: () => hapusQris(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qris"] }),
  });

  function pilihFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  const ditampilkan = preview ?? qris;

  return (
    <AppShell
      title="Pengaturan"
      subtitle="Kode QRIS untuk pembayaran jajanan"
      label="Sopo Harimoting · Admin"
      menu={MENU_ADMIN}
    >
      <div className="kartu-farm p-5">
        <p className="font-display text-xl font-black">Kode QRIS</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload foto/scan kode QRIS toko kamu. Ini bakal ditampilkan ke pembeli tiap kali metode
          bayar "QRIS" dipilih di halaman Jual.
        </p>

        <div className="mt-4 flex justify-center">
          {ditampilkan ? (
            <img
              src={ditampilkan}
              alt="Kode QRIS"
              className="h-56 w-56 rounded-2xl border-4 border-wood object-contain bg-white p-2"
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-2xl border-4 border-dashed border-wood/40 bg-secondary/60 text-center text-sm font-bold text-muted-foreground">
              Belum ada QRIS ter-upload
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pilihFile(e.target.files?.[0])}
        />

        <button
          onClick={() => fileRef.current?.click()}
          className="mt-5 w-full rounded-2xl bg-secondary px-4 py-4 text-center font-black text-secondary-foreground"
        >
          📁 Pilih Gambar QRIS
        </button>

        {preview ? (
          <button
            onClick={() => simpanMutation.mutate(preview)}
            disabled={simpanMutation.isPending}
            className="mt-3 w-full rounded-2xl bg-accent px-4 py-4 text-center font-display text-lg font-black text-accent-foreground shadow-lift disabled:opacity-60"
          >
            {simpanMutation.isPending ? "Menyimpan..." : "✅ Simpan QRIS"}
          </button>
        ) : null}

        {qris && !preview ? (
          <button
            onClick={() => {
              if (confirm("Hapus QRIS yang ter-upload?")) hapusMutation.mutate();
            }}
            className="mt-3 w-full rounded-2xl bg-destructive/10 px-4 py-3 text-center font-black text-destructive"
          >
            Hapus QRIS
          </button>
        ) : null}
      </div>
    </AppShell>
  );
}
