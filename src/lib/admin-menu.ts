import type { MenuItem } from "@/components/AppShell";

export const MENU_ADMIN: MenuItem[] = [
  { to: "/admin/kasir", label: "Tiket", icon: "🎟️" },
  { to: "/admin/verifikasi", label: "Verif", icon: "✅" },
  { to: "/admin/scan", label: "Scan", icon: "📷" },
  { to: "/admin/jual", label: "Jual", icon: "🛒" },
  { to: "/admin/stok", label: "Stok", icon: "📦" },
  { to: "/admin/laporan", label: "Laporan", icon: "📊" },
];
