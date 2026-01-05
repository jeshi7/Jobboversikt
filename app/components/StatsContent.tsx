"use client";

import { Heading, BodyShort, Panel, Tag, Button } from "@navikt/ds-react";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import type { Application } from "../../lib/applications";
import type { OverviewRow } from "../../lib/overview";

interface StatsContentProps {
  apps: Application[];
  summary: { total: number; sent: number; interview: number; planned: number };
  overviewRows: OverviewRow[];
  successRate: number;
  avgResponseTime: number | null;
}

function StatusBar({
  label,
  value,
  total,
  tone
}: {
  label: string;
  value: number;
  total: number;
  tone: "muted" | "positive" | "warning";
}) {
  const ratio = total > 0 ? value / total : 0;
  const width = `${Math.max(6, Math.round(ratio * 100))}%`;

  const toneClass =
    tone === "positive"
      ? "bg-emerald-500/60"
      : tone === "warning"
        ? "bg-amber-500/70"
        : "bg-slate-400/70";

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {value} / {total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${toneClass} transition-all`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

export function StatsContent({
  apps,
  summary,
  overviewRows,
  successRate,
  avgResponseTime
}: StatsContentProps) {
  const { user } = useCurrentUser();
  
  const sentRatio =
    summary.total > 0 ? Math.round((summary.sent / summary.total) * 100) : 0;
  const interviewRatio =
    summary.total > 0
      ? Math.round((summary.interview / summary.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <BodyShort
          size="small"
          className="text-xs uppercase tracking-[0.25em] text-slate-500"
        >
          Tall
        </BodyShort>
        <Heading level="1" size="medium">
          {user?.role === "admin" || user?.role === "consultant"
            ? "Mønstre i søknadsarbeidet - Alle klienter"
            : "Mønstre i søknadsarbeidet ditt"}
        </Heading>
        <BodyShort size="small" className="max-w-2xl text-slate-600">
          {user?.role === "admin" || user?.role === "consultant"
            ? "En enkel, rolig oversikt over volum og fremdrift for alle klienter."
            : "En enkel, rolig oversikt over volum og fremdrift."}
        </BodyShort>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Totalt selskaper
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {summary.total}
          </Heading>
        </Panel>
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Sendt-andel
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {sentRatio}%
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            av registrerte selskaper har fått søknad.
          </BodyShort>
        </Panel>
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Intervju-andel
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {interviewRatio}%
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            har ledet til en dypere samtale.
          </BodyShort>
        </Panel>
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Planlagte søknader
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {summary.planned}
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            potensielle neste steg i mappen din.
          </BodyShort>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Panel border className="space-y-4">
          <div>
            <Heading level="2" size="small">
              Fordeling per status
            </Heading>
            <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
              En enkel stolpediagram, laget med ren layout.
            </BodyShort>
          </div>
          <StatusBar
            label="Planlagt"
            value={summary.planned}
            total={summary.total}
            tone="muted"
          />
          <StatusBar
            label="Sendt"
            value={summary.sent}
            total={summary.total}
            tone="positive"
          />
          <StatusBar
            label="Intervju"
            value={summary.interview}
            total={summary.total}
            tone="warning"
          />
          {summary.total > 0 && (
            <>
              <StatusBar
                label="Avslag"
                value={apps.filter((a) => a.status === "avslått").length}
                total={summary.total}
                tone="muted"
              />
              <StatusBar
                label="Ansatt"
                value={apps.filter((a) => a.status === "ansatt").length}
                total={summary.total}
                tone="positive"
              />
            </>
          )}
        </Panel>

        <Panel border className="space-y-4">
          <div>
            <Heading level="2" size="small">
              Ytelsesstatistikk
            </Heading>
            <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
              Mål og resultater
            </BodyShort>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <BodyShort size="small" className="text-slate-700 font-medium">
                  Responsrate
                </BodyShort>
                <BodyShort size="small" className="text-slate-900 font-semibold">
                  {successRate}%
                </BodyShort>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all"
                  style={{ width: `${successRate}%` }}
                />
              </div>
              <BodyShort size="small" className="text-slate-500 text-[11px] mt-1">
                Prosent av sendte søknader som har fått svar
              </BodyShort>
            </div>
            
            {avgResponseTime !== null && (
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <BodyShort size="small" className="text-slate-700 font-medium">
                    Gjennomsnittlig svartid
                  </BodyShort>
                  <BodyShort size="small" className="text-slate-900 font-semibold">
                    {avgResponseTime} dager
                  </BodyShort>
                </div>
                <BodyShort size="small" className="text-slate-500 text-[11px] mt-1">
                  Tid fra søknad sendt til første svar/intervju
                </BodyShort>
              </div>
            )}
          </div>
        </Panel>

        <ActivityHeatmap />

        <Panel border className="space-y-3 text-sm text-slate-600">
          <Heading level="2" size="small" className="text-slate-900">
            Mykere tolkning av tallene
          </Heading>
          <BodyShort size="small">
            I stedet for å jage KPI-er, kan du bruke denne siden til å se om
            innsatsen din er jevn over tid, og om du følger opp gode spor.
          </BodyShort>
          <BodyShort size="small">
            Hver mappe og hvert dokument i{" "}
            <span className="font-medium">Jobb_Søknad_Pakke</span> representerer
            faktisk arbeid du har lagt ned.
          </BodyShort>
          <div className="pt-4 border-t border-slate-200">
            <BodyShort size="small" className="text-slate-500 mb-2">
              Eksporter data
            </BodyShort>
            <Button
              as="a"
              href="/api/export?format=csv"
              size="small"
              variant="secondary"
            >
              📥 Last ned som CSV
            </Button>
          </div>
        </Panel>
      </section>
    </div>
  );
}
