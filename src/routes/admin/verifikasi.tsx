import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MENU_ADMIN } from "@/lib/admin-menu";
import { LABEL, rupiah, tanggalJam } from "@/lib/tickets";
import { ambilTiketMenunggu, setujuiTiket, tolakTiket } from "@/lib/tickets.server";

export const Route = createFileRoute("/admin/verifikasi")({
  head: () => ({
    meta: [{ title: "Verifikasi Pesanan — Sopo Harimoting" }],
  }),
  component: VerifikasiPage,
});

function VerifikasiPage() {
  const queryClient = useQueryClient();
  const { data: pesanan } = useQuery({
    queryKey: ["tiket-menunggu"],
    queryFn: () => ambilTiketMenunggu(),
    refetchInterval: 4000,
  });

  const [lihatBukti, setLihatBukti] = useState<string | null>(null);

  function selesai() {
    queryClient.invalidateQueries({ queryKey: ["tiket-menunggu"] });
    queryClient.invalidateQueries({ queryKey: ["tiket"] });
  }

  const setujuiMutation = useMutation({
    mutationFn: (kode: string) => setujuiTiket({ data: kode }),
    onSuccess: selesai,
  });
  const tolakMutation = useMutation({
    mutationFn: (kode: string) => tolakTiket({ data: kode }),
    onSuccess: selesai,
  });

  return (
    <AppShell
      title="Verifikasi Pesanan"
      subtitle="Cek & setujui pesanan tiket yang masuk"
      label="Sopo Harimoting · Admin"
      menu={MENU_ADMIN}
    >
      {!pesanan || pesanan.length === 0 ? (
        <p className="kartu-farm p-6 text-center text-lg font-bold text-muted-foreground">
          Gak ada pesanan yang menunggu. Semua udah beres 👍
        </p>
      ) : (
        <div className="space-y-4">
          {pesanan.map((p) => (
            <div key={p.kode} className="kartu-farm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-xl font-black">{p.kode}</p>
                  <p className="text-sm font-bold text-muted-foreground">
                    {LABEL[p.kategori]} × {p.jumlah} · {tanggalJam(p.dibuatPada)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">
                  {p.metode === "qris" ? "📱 QRIS" : "💵 Cash"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                <span className="text-sm font-bold">Total</span>
                <span className="font-display text-lg font-black text-primary">{rupiah(p.total)}</span>
              </div>

              {p.metode === "qris" && p.buktiTf ? (
                <button
                  onClick={() => setLihatBukti(p.buktiTf)}
                  className="mt-3 w-full overflow-hidden rounded-xl border-2 border-border"
                >
                  <img src={p.buktiTf} alt="Bukti transfer" className="h-32 w-full object-cover" />
                  <span className="block bg-secondary py-1.5 text-center text-xs font-black text-secondary-foreground">
                    🔍 Lihat bukti transfer penuh
                  </span>
                </button>
              ) : null}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => tolakMutation.mutate(p.kode)}
                  disabled={setujuiMutation.isPending || tolakMutation.isPending}
                  className="flex-1 rounded-xl bg-destructive/10 px-4 py-3 font-black text-destructive disabled:opacity-60"
                >
                  ❌ Tolak
                </button>
                <button
                  onClick={() => setujuiMutation.mutate(p.kode)}
                  disabled={setujuiMutation.isPending || tolakMutation.isPending}
                  className="flex-1 rounded-xl bg-accent px-4 py-3 font-black text-accent-foreground shadow-lift disabled:opacity-60"
                >
                  ✅ Setujui
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pop-up lihat bukti transfer penuh */}
      {lihatBukti ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setLihatBukti(null)}
        >
          <img
            src={lihatBukti}
            alt="Bukti transfer"
            className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
