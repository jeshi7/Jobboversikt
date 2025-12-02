import { loadApplications, type Application } from "../../lib/applications";
import { Heading, BodyShort, Panel } from "@navikt/ds-react";
import { ResourceCard } from "../components/ResourceCard";

export default function ResourcesPage() {
  const apps = loadApplications();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <BodyShort
          size="small"
          className="text-xs uppercase tracking-[0.25em] text-slate-500"
        >
          Ressurser
        </BodyShort>
        <Heading level="1" size="medium">
          Alt innholdet du har laget, samlet på ett rolig sted
        </Heading>
        <BodyShort size="small" className="max-w-2xl text-slate-600">
          CV-er, søknadsbrev, utlysninger og notater, organisert etter selskap
          og hentet direkte fra mappene dine.
        </BodyShort>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <ResourceCard key={app.id} app={app} />
        ))}
        {apps.length === 0 && (
          <Panel border className="text-xs text-slate-500">
            Ingen ressurser funnet ennå. Når du fyller mappene under{" "}
            <span className="font-medium">Jobb_Søknad_Pakke</span>, vil
            innholdet listes her automatisk.
          </Panel>
        )}
      </section>
    </div>
  );
}

function getPrimaryResources(
  resources: { name: string; relativePath: string }[],
  limit: number
) {
  const important = resources.filter((r) =>
    /cv|søknadsbrev|cover|utlysning/i.test(r.name)
  );
  const base = important.length > 0 ? important : resources;
  return base.slice(0, limit);
}

