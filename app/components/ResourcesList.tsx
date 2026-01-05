"use client";

import { useState, useMemo } from "react";
import type { Application } from "../../lib/applications";
import { Panel, BodyShort } from "@navikt/ds-react";
import { ResourceCard } from "./ResourceCard";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";

interface ResourcesListProps {
  apps: Application[];
}

export function ResourcesList({ apps }: ResourcesListProps) {
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) {
      return apps;
    }

    const query = searchQuery.toLowerCase();
    return apps.filter((app) => {
      // Search in company name
      if (app.company.toLowerCase().includes(query)) {
        return true;
      }

      // Search in job title
      if (app.jobTitle?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in resource names
      const matchingResources = app.resources.some((resource) =>
        resource.name.toLowerCase().includes(query)
      );
      if (matchingResources) {
        return true;
      }

      return false;
    });
  }, [apps, searchQuery]);

  const getDescription = () => {
    if (user?.role === "admin" || user?.role === "consultant") {
      return "CV-er, søknadsbrev, utlysninger og notater for alle klienter, organisert etter selskap.";
    }
    return "CV-er, søknadsbrev, utlysninger og notater, organisert etter selskap og hentet direkte fra mappene dine.";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Søk etter selskap, stilling eller dokumentnavn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        {filteredApps.length !== apps.length && (
          <BodyShort size="small" className="text-slate-500">
            {filteredApps.length} av {apps.length} selskaper
          </BodyShort>
        )}
      </div>
      
      {user && (
        <BodyShort size="small" className="text-slate-500 max-w-2xl">
          {getDescription()}
        </BodyShort>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredApps.map((app) => (
          <ResourceCard key={app.id} app={app} />
        ))}
        {filteredApps.length === 0 && apps.length > 0 && (
          <Panel border className="text-xs text-slate-500 col-span-full">
            Ingen selskaper matcher søket ditt.
          </Panel>
        )}
        {apps.length === 0 && (
          <Panel border className="text-xs text-slate-500 col-span-full">
            Ingen ressurser funnet ennå. Når du fyller mappene under{" "}
            <span className="font-medium">Jobb_Søknad_Pakke</span>, vil
            innholdet listes her automatisk.
          </Panel>
        )}
      </div>
    </div>
  );
}

