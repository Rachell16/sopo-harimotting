import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MENU_MANAGER } from "@/lib/manager-menu";
import { rupiah } from "@/lib/tickets";
import {
  ambilKaryawan,
  buatKaryawan,
  hapusKaryawan,
  updateKaryawan,
} from "@/lib/karyawan.server";
import type { Karyawan } from "@/lib/karyawan";

export const Route = createFileRoute("/manager/karyawan")({
  head: () => ({ meta: [{ title: "Karyawan — Sopo Harimotting" }] }),
  component: KaryawanPage,
});

type Form = {
  kode: string | null;
  nama: string;
  username: string;
  pin: string;
  gajiHarian: string;
  aktif: boolean;
};

function KaryawanPage() {
  const queryClient = useQueryClient();
  const { data: karyawan } = useQuery({
    queryKey: ["karyawan"],
    queryFn: () => ambilKaryawan(),
  });
  const [form, setForm] = useState<Form | null>(null);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const simpanMutation = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const data = {
        nama: form.nama.trim(),
        username: form.username.trim(),
        pin: form.pin.trim(),
        gajiHarian: Number(form.gajiHarian) || 0,
      };
      if (form.kode)
        return updateKaryawan({
          data: { kode: form.kode, ...data, aktif: form.aktif },
        });
      return buatKaryawan({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["karyawan"] });
      setForm(null);
      setPesanError(null);
    },
    onError: (err: any) => setPesanError(err?.message || "Gagal menyimpan."),
  });

  const hapusMutation = useMutation({
    mutationFn: (kode: string) => hapusKaryawan({ data: kode }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["karyawan"] }),
  });

  return (
    <AppShell
      title="Karyawan"
      subtitle="Kelola data & PIN absensi karyawan"
      label="Sopo Harimotting · Manager"
      menu={MENU_MANAGER}
    >
      <button
        onClick={() => {
          setForm({
            kode: null,
            nama: "",
            username: "",
            pin: "",
            gajiHarian: "",
            aktif: true,
          });
          setPesanError(null);
        }}
        className="mb-5 w-full rounded-2xl bg-accent px-4 py-4 text-center font-display text-xl font-black text-accent-foreground shadow-lift"
      >
        + Tambah Karyawan
      </button>

      {!karyawan || karyawan.length === 0 ? (
        <p className="kartu-farm p-6 text-center text-lg font-bold text-muted-foreground">
          Belum ada karyawan. Tambahin dulu yuk.
        </p>
      ) : (
        <div className="kartu-farm divide-y-2 divide-dashed divide-border overflow-hidden">
          {karyawan.map((k: Karyawan) => (
            <div key={k.kode} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-black">
                  {k.nama}{" "}
                  {!k.aktif ? (
                    <span className="text-sm text-muted-foreground">
                      (nonaktif)
                    </span>
                  ) : null}
                </p>
                <p className="text-sm font-bold text-muted-foreground">
                  @{k.username} · PIN: {k.pin} · Gaji harian:{" "}
                  {rupiah(k.gajiHarian)}
                </p>
              </div>
              <button
                onClick={() =>
                  setForm({
                    kode: k.kode,
                    nama: k.nama,
                    username: k.username,
                    pin: k.pin,
                    gajiHarian: String(k.gajiHarian),
                    aktif: k.aktif,
                  })
                }
                className="shrink-0 rounded-xl bg-secondary px-3 py-2 text-sm font-black text-secondary-foreground"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Hapus data karyawan "${k.nama}"? Riwayat absensinya juga ikut terhapus.`,
                    )
                  ) {
                    hapusMutation.mutate(k.kode);
                  }
                }}
                className="shrink-0 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-black text-destructive"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

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
              {form.kode ? "Edit Karyawan" : "Tambah Karyawan"}
            </p>

            <label className="mt-4 block text-sm font-bold text-muted-foreground">
              Nama
            </label>
            <input
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Contoh: Budi"
              className="mt-1 h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg font-bold"
              autoFocus
            />

            <label className="mt-4 block text-sm font-bold text-muted-foreground">
              Username (buat login)
            </label>
            <input
              value={form.username}
              onChange={(e) =>
                setForm({
                  ...form,
                  username: e.target.value.replace(/\s/g, "").toLowerCase(),
                })
              }
              placeholder="budi"
              className="mt-1 h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg font-bold"
            />

            <label className="mt-4 block text-sm font-bold text-muted-foreground">
              PIN (buat login)
            </label>
            <input
              value={form.pin}
              onChange={(e) =>
                setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })
              }
              inputMode="numeric"
              placeholder="1234"
              className="mt-1 h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg font-bold"
            />

            <label className="mt-4 block text-sm font-bold text-muted-foreground">
              Gaji harian (Rp)
            </label>
            <input
              value={form.gajiHarian}
              onChange={(e) =>
                setForm({
                  ...form,
                  gajiHarian: e.target.value.replace(/\D/g, ""),
                })
              }
              inputMode="numeric"
              placeholder="100000"
              className="mt-1 h-14 w-full rounded-xl border-2 border-border bg-background px-4 text-lg font-bold"
            />

            {form.kode ? (
              <label className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.aktif}
                  onChange={(e) =>
                    setForm({ ...form, aktif: e.target.checked })
                  }
                  className="h-5 w-5"
                />
                <span className="text-sm font-bold">Masih aktif kerja</span>
              </label>
            ) : null}

            {pesanError ? (
              <p className="mt-3 text-sm font-bold text-destructive">
                {pesanError}
              </p>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setForm(null)}
                className="flex-1 rounded-xl bg-secondary px-4 py-4 font-black text-secondary-foreground"
              >
                Batal
              </button>
              <button
                onClick={() => simpanMutation.mutate()}
                disabled={
                  !form.nama.trim() ||
                  !form.username.trim() ||
                  !form.pin.trim() ||
                  simpanMutation.isPending
                }
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
