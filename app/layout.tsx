"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Heading, BodyShort } from "@navikt/ds-react";

const navItems = [
  { href: "/", label: "Oversikt" },
  { href: "/applications", label: "Søknader" },
  { href: "/resources", label: "Ressurser" },
  { href: "/kompetanse", label: "Kompetanse" },
  { href: "/stats", label: "Tall" }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <html lang="no">
      <body className="min-h-screen bg-background text-slate-900">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-borderSoft bg-surface">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:py-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-white">
                  JO
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Jobboversikt
                  </p>
                  <Heading level="1" size="xsmall" className="text-slate-900">
                    Søknader og ressurser
                  </Heading>
                </div>
              </div>
              <nav
                className="no-scrollbar flex gap-1 overflow-x-auto text-sm"
                aria-label="Hovednavigasjon"
              >
                {navItems.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "relative rounded-full px-3 py-1 text-sm transition-colors",
                        active
                          ? "text-accent"
                          : "text-slate-700 hover:bg-slate-100"
                      ].join(" ")}
                    >
                      {item.label}
                      {active && (
                        <span className="pointer-events-none absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-accent" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
          </main>

          <footer className="border-t border-borderSoft bg-surface/80">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-xs text-slate-500">
              <BodyShort size="small">
                Bygd for å gi deg oversikt, ikke stress.
              </BodyShort>
              <BodyShort size="small">Jessie Macharia · Jobboversikt</BodyShort>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}


