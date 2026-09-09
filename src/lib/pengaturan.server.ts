import { createServerFn } from "@tanstack/react-start";
import { MODE_DEMO, pastikanSkema, sql } from "./db";

// Dipakai kalau DATABASE_URL belum diset.
let qrisDemo: string | null = null;

const KUNCI_QRIS = "qris_image";

// Gambar QRIS disimpan sebagai data URL base64 langsung di kolom TEXT —
// cukup buat skala kecil (1 gambar), gak perlu setup object storage terpisah.
export const ambilQris = createServerFn({ method: "GET" }).handler(async (): Promise<string | null> => {
  if (MODE_DEMO) return qrisDemo;

  await pastikanSkema();
  const rows = (await sql`SELECT value FROM pengaturan WHERE key = ${KUNCI_QRIS}`) as { value: string }[];
  return rows[0]?.value ?? null;
});

export const simpanQris = createServerFn({ method: "POST" })
  .validator((dataUrl: string) => dataUrl)
  .handler(async ({ data: dataUrl }): Promise<{ ok: true }> => {
    if (MODE_DEMO) {
      qrisDemo = dataUrl;
      return { ok: true };
    }

    await pastikanSkema();
    await sql`
      INSERT INTO pengaturan (key, value) VALUES (${KUNCI_QRIS}, ${dataUrl})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
    return { ok: true };
  });

export const hapusQris = createServerFn({ method: "POST" }).handler(async (): Promise<{ ok: true }> => {
  if (MODE_DEMO) {
    qrisDemo = null;
    return { ok: true };
  }

  await pastikanSkema();
  await sql`DELETE FROM pengaturan WHERE key = ${KUNCI_QRIS}`;
  return { ok: true };
});
