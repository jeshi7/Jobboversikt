"use client";

import type { Application } from "../../lib/applications";
import { Heading, Panel, BodyShort, Tag } from "@navikt/ds-react";
import { useState, useMemo } from "react";

interface ApplicationsListProps {
  apps: Application[];
}

export function ApplicationsList({ apps }: ApplicationsListProps) {
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredApps = useMemo(() => {
    let filtered = apps;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((app) => {
        return (
          app.company.toLowerCase().includes(query) ||
          app.jobTitle?.toLowerCase().includes(query) ||
          app.location?.toLowerCase().includes(query) ||
          app.status.toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    return filtered;
  }, [apps, searchQuery, statusFilter]);

  const getDescription = () => {
    if (user?.role === "admin" || user?.role === "consultant") {
      return "En rolig liste over alle klienters planlagte og sendte søknader, koblet til dokumentene i systemet.";
    }
    return "En rolig liste over både planlagte og sendte søknader, koblet til dokumentene dine i systemet.";
  };

  return (
    <Panel border>
      <div className="mb-4 space-y-4">
        {user && (
          <BodyShort size="small" className="text-slate-600">
            {getDescription()}
          </BodyShort>
        )}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Søk etter selskap, stilling eller sted..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <BodyShort size="small" className="text-slate-500">
            {filteredApps.length} av {apps.length} søknader
          </BodyShort>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              statusFilter === null
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-150"
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === "planlagt" ? null : "planlagt")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              statusFilter === "planlagt"
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-150"
            }`}
          >
            Planlagt
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === "sendt" ? null : "sendt")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              statusFilter === "sendt"
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-150"
            }`}
          >
            Sendt
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === "intervju" ? null : "intervju")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              statusFilter === "intervju"
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-150"
            }`}
          >
            Intervju
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === "avslått" ? null : "avslått")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              statusFilter === "avslått"
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-150"
            }`}
          >
            Avslag
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === "ansatt" ? null : "ansatt")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              statusFilter === "ansatt"
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-150"
            }`}
          >
            Ansatt
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-borderSoft/70 bg-surface">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Selskap</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Notat / søknad</th>
              <th className="px-4 py-3 text-left font-medium">Dokumenter</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.map((app, index) => (
              <tr
                key={app.id}
                className={
                  "border-borderSoft/40 bg-white transition-colors hover:bg-slate-50" +
                  (index === 0 ? "" : " border-t") +
                  (index === filteredApps.length - 1 ? " border-b-0" : "")
                }
              >
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-slate-900">
                    {app.company}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusPill status={app.status} />
                </td>
                <td className="px-4 py-3 align-top text-xs text-slate-500">
                  {hasBothPdfs(app.resources)
                    ? "Sendt søknad"
                    : "Forbereder"}
                </td>
                <td className="px-4 py-3 align-top text-xs text-slate-500">
                  <ul className="space-y-0.5">
                    {getPrimaryResources(app.resources).map((r) => (
                      <li key={r.relativePath}>{r.name}</li>
                    ))}
                    {app.resources.length > getPrimaryResources(app.resources).length && (
                      <li>
                        +{" "}
                        {app.resources.length - getPrimaryResources(app.resources).length}{" "}
                        flere dokumenter
                      </li>
                    )}
                  </ul>
                </td>
              </tr>
            ))}
            {filteredApps.length === 0 && apps.length > 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-xs text-slate-500"
                >
                  Ingen søknader matcher søket ditt.
                </td>
              </tr>
            )}
            {apps.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-xs text-slate-500"
                >
                  Ingen søknader funnet ennå. Når du legger til mapper under{" "}
                  <span className="font-medium">
                    02_Søknader/Alle selskaper
                  </span>{" "}
                  eller filer i{" "}
                  <span className="font-medium">
                    02_Søknader/Planlagte_Søknader
                  </span>
                  , dukker de opp her automatisk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; variant: "neutral" | "success" | "warning" | "error" }
  > = {
    planlagt: {
      label: "Planlagt",
      variant: "neutral"
    },
    forberedes: {
      label: "Forberedes",
      variant: "neutral"
    },
    sendt: {
      label: "Sendt",
      variant: "success"
    },
    intervju: {
      label: "Intervju",
      variant: "warning"
    },
    avslått: {
      label: "Avslått",
      variant: "error"
    },
    ansatt: {
      label: "Ansatt",
      variant: "success"
    }
  };

  const conf = map[status] ?? map.planlagt;

  return (
    <Tag size="small" variant={conf.variant}>
      {conf.label}
    </Tag>
  );
}

function getPrimaryResources(
  resources: { name: string; relativePath: string }[]
) {
  const important = resources.filter((r) =>
    /cv|søknadsbrev|cover|utlysning/i.test(r.name)
  );
  const base = important.length > 0 ? important : resources;
  return base.slice(0, 3);
}

function hasBothPdfs(
  resources: { name: string; relativePath: string }[]
): boolean {
  const hasCvPdf = resources.some(
    (r) =>
      r.name.toLowerCase().includes("cv") &&
      r.name.toLowerCase().endsWith(".pdf")
  );
  const hasCoverLetterPdf = resources.some(
    (r) =>
      (r.name.toLowerCase().includes("søknad") ||
        r.name.toLowerCase().includes("cover letter") ||
        r.name.toLowerCase().includes("søknadsbrev")) &&
      r.name.toLowerCase().endsWith(".pdf")
  );
  return hasCvPdf && hasCoverLetterPdf;
}

