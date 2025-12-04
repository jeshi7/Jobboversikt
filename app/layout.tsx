"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode, useEffect } from "react";
import { Heading, BodyShort } from "@navikt/ds-react";

const navItems = [
  { href: "/", label: "Oversikt" },
  { href: "/applications", label: "Søknader" },
  { href: "/resources", label: "Ressurser" },
  { href: "/kompetanse", label: "Kompetanse" },
  { href: "/tips", label: "Tips" },
  { href: "/stats", label: "Tall" }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("nav") && !target.closest("button[aria-label='Åpne meny']")) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mobileMenuOpen]);

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
              
              {/* Desktop Navigation */}
              <nav
                className="hidden lg:flex gap-1 text-sm"
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

              {/* Mobile Burger Button */}
              <button
                type="button"
                aria-label="Åpne meny"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span
                  className={`block h-0.5 w-6 bg-slate-700 transition-all ${
                    mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-slate-700 transition-all ${
                    mobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-slate-700 transition-all ${
                    mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <nav
                className="lg:hidden border-t border-borderSoft bg-surface"
                aria-label="Hovednavigasjon mobil"
              >
                <div className="mx-auto max-w-6xl px-6 py-4 space-y-1">
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
                          "block rounded-lg px-4 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-slate-700 hover:bg-slate-100"
                        ].join(" ")}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            )}
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


