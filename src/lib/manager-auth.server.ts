import { createServerFn } from "@tanstack/react-start";

// PIN manager terpisah dari ADMIN_PIN, diisi lewat env var MANAGER_PIN.
// Default "9999" kalau belum diset — WAJIB diganti sebelum dipakai beneran.
export const cekPinManager = createServerFn({ method: "POST" })
  .validator((pin: string) => pin)
  .handler(async ({ data: pin }): Promise<{ ok: boolean }> => {
    const pinAsli = process.env.MANAGER_PIN || "9999";
    return { ok: pin === pinAsli };
  });
