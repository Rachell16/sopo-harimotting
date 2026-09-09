import { createServerFn } from "@tanstack/react-start";

// PIN admin diisi lewat environment variable ADMIN_PIN (set di Vercel: Settings -> Environment Variables).
// Kalau belum diset sama sekali, default "1234" dipakai supaya gak error saat pertama kali coba —
// GANTI ini di Vercel sebelum dipakai beneran di lapangan.
export const cekPinAdmin = createServerFn({ method: "POST" })
  .validator((pin: string) => pin)
  .handler(async ({ data: pin }): Promise<{ ok: boolean }> => {
    const pinAsli = process.env.ADMIN_PIN || "1234";
    return { ok: pin === pinAsli };
  });
