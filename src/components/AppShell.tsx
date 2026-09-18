import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type MenuItem = { to: string; label: string; icon: string };

export function AppShell({
  title,
  subtitle,
  children,
  menu,
  label = "Sopo Harimoting",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Item navigasi bawah. Kosongkan (atau jangan diisi) kalau halaman ini berdiri sendiri tanpa tab. */
  menu?: MenuItem[];
  /** Label kecil di atas judul, misal "Sopo Harimoting" atau "Sopo Harimoting · Admin" */
  label?: string;
}) {
  return (
    <div className={menu && menu.length > 0 ? "min-h-screen pb-28" : "min-h-screen pb-8"}>
      <header className="panel-kayu px-4 py-5 shadow-lift print:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">{label}</p>
            <h1 className="truncate font-display text-2xl font-black sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm opacity-85">{subtitle}</p> : null}
          </div>
          <span className="shrink-0 text-4xl">🐴</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>

      {menu && menu.length > 0 ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t-4 border-wood bg-card/95 backdrop-blur print:hidden">
          <div
            className="mx-auto grid max-w-3xl"
            style={{ gridTemplateColumns: `repeat(${menu.length}, minmax(0, 1fr))` }}
          >
            {menu.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                activeOptions={{ exact: m.to === "/" }}
                className={`flex flex-col items-center gap-0.5 text-center font-bold text-muted-foreground ${
                  menu.length > 4 ? "px-0.5 py-2 text-[11px] leading-tight" : "py-3 text-base"
                }`}
                activeProps={{ className: "!text-primary bg-secondary/70" }}
              >
                <span className={menu.length > 4 ? "text-xl leading-none" : "text-2xl leading-none"}>
                  {m.icon}
                </span>
                {m.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
