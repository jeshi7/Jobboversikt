import { loadApplications } from "../../lib/applications";
import { Heading, Panel, BodyShort, Tag } from "@navikt/ds-react";

export default function ApplicationsPage() {
  const apps = loadApplications();

  return (
    <div className="space-y-6">
      <header>
        <Heading level="1" size="medium">
          Søknader
        </Heading>
        <BodyShort size="small" className="mt-1 max-w-2xl text-slate-600">
          En rolig liste over både planlagte og sendte søknader, koblet til
          dokumentene dine i systemet.
        </BodyShort>
      </header>

      <section>
        <Panel border>
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Tag size="small" variant="neutral">
                Planlagt
              </Tag>
              <Tag size="small" variant="success">
                Sendt
              </Tag>
              <Tag size="small" variant="warning">
                Intervju
              </Tag>
              <Tag size="small" variant="error">
                Avslag
              </Tag>
              <Tag size="small" variant="success">
                Ansatt
              </Tag>
            </div>
            <BodyShort size="small" className="text-slate-500">
              Hentes automatisk fra søknadsmappene dine.
            </BodyShort>
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
                {apps.map((app, index) => (
                  <tr
                    key={app.id}
                    className={
                      "border-borderSoft/40 bg-white transition-colors hover:bg-slate-50" +
                      (index === 0 ? "" : " border-t") +
                      (index === apps.length - 1 ? " border-b-0" : "")
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
      </section>
    </div>
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


