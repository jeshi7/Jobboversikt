"use client";

import { useState } from "react";
import { Heading, BodyShort, Panel, Tag } from "@navikt/ds-react";

type Resource = {
  name: string;
  relativePath: string;
};

type Props = {
  app: {
    company: string;
    resources: Resource[];
  };
};

export function ResourceCard({ app }: Props) {
  const [showAll, setShowAll] = useState(false);

  const visibleResources = showAll
    ? app.resources
    : getPrimaryResources(app.resources, 5);

  const hiddenCount = app.resources.length - visibleResources.length;

  return (
    <Panel
      border
      className="flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-subtle transition"
    >
      <div>
        <Heading level="2" size="xsmall" className="text-slate-900">
          {app.company}
        </Heading>
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs text-slate-600">
        {visibleResources.map((r) => (
          <a
            key={r.relativePath}
            href={`/api/files?path=${encodeURIComponent(r.relativePath)}`}
            target="_blank"
            rel="noreferrer"
            className="max-w-full"
          >
            <Tag
              size="small"
              variant="neutral"
              className="max-w-full truncate"
            >
              {r.name}
            </Tag>
          </a>
        ))}
        {app.resources.length === 0 && (
          <BodyShort size="xsmall" className="text-slate-500">
            Ingen dokumenter registrert ennå.
          </BodyShort>
        )}
      </div>
      {hiddenCount > 0 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="self-start text-[11px] text-slate-600 underline underline-offset-2"
        >
          + {hiddenCount} flere dokumenter
        </button>
      )}
    </Panel>
  );
}

function getPrimaryResources(resources: Resource[], limit: number) {
  const important = resources.filter((r) =>
    /cv|søknadsbrev|cover|utlysning/i.test(r.name)
  );
  const base = important.length > 0 ? important : resources;
  return base.slice(0, limit);
}


