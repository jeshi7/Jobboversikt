"use client";

import type { Application } from "../../lib/applications";
import { useState } from "react";
import { Heading, BodyShort, Tag, Button } from "@navikt/ds-react";

interface PipelineBoardProps {
  planned: Application[];
  sent: Application[];
  interview: Application[];
}

export function PipelineBoard({ planned, sent, interview }: PipelineBoardProps) {
  const [open, setOpen] = useState<{
    app: Application;
  } | null>(null);

  const columns: { title: string; items: Application[] }[] = [
    { title: "Planlagt", items: planned },
    { title: "Sendt", items: sent },
    { title: "Intervju", items: interview }
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <div key={col.title} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {col.title}
              </h3>
              <span className="text-xs text-slate-400">
                {col.items.length}
              </span>
            </div>
            <div className="space-y-2">
              {col.items.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  className="w-full text-left"
                  onClick={() => setOpen({ app })}
                >
                  <article className="rounded-2xl border border-borderSoft/50 bg-surface px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-subtle">
                    <p className="text-sm font-medium text-slate-900">
                      {app.company}
                    </p>
                  </article>
                </button>
              ))}
              {col.items.length === 0 && (
                <p className="rounded-xl border border-dashed border-borderSoft bg-slate-50 px-3 py-4 text-xs text-slate-500">
                  Ingen i denne fasen ennå.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-5 shadow-subtle">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Heading level="2" size="small">
                  {open.app.jobTitle || open.app.company}
                </Heading>
                <BodyShort size="small" className="mt-1 text-slate-600 text-[11px]">
                  {open.app.company}
                  {open.app.location ? ` · ${open.app.location}` : null}
                </BodyShort>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                  {open.app.deadline && (
                    <Tag size="small" variant="neutral">
                      Frist: {open.app.deadline}
                    </Tag>
                  )}
                  {open.app.employmentType && (
                    <Tag size="small" variant="info">
                      {open.app.employmentType}
                    </Tag>
                  )}
                </div>
              </div>
              <Button
                size="xsmall"
                variant="tertiary"
                onClick={() => setOpen(null)}
              >
                Lukk
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <Heading level="3" size="xsmall">
                  Kort om stillingen
                </Heading>
                <BodyShort
                  size="small"
                  className="whitespace-pre-wrap text-slate-700"
                >
                  {open.app.jobSnippet && open.app.jobSnippet.length > 0
                    ? open.app.jobSnippet
                    : "Fant ingen utlysning for dette selskapet ennå."}
                </BodyShort>
              </div>

              {open.app.angle && (
                <div className="space-y-1">
                  <Heading level="3" size="xsmall">
                    Din vinkel
                  </Heading>
                  <BodyShort
                    size="small"
                    className="whitespace-pre-wrap text-slate-700"
                  >
                    {open.app.angle}
                  </BodyShort>
                </div>
              )}

              {(open.app.listingUrl ||
                open.app.applyTo ||
                open.app.contact) && (
                <div className="space-y-1">
                  <Heading level="3" size="xsmall">
                    Praktisk info
                  </Heading>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {open.app.listingUrl && (
                      <li>
                        <a
                          href={open.app.listingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent underline underline-offset-2"
                        >
                          Åpne utlysning
                        </a>
                      </li>
                    )}
                    {open.app.applyTo && (
                      <li>Søknad sendes: {open.app.applyTo}</li>
                    )}
                    {open.app.contact && <li>Kontakt: {open.app.contact}</li>}
                  </ul>
                </div>
              )}

              {open.app.resources && open.app.resources.length > 0 && (
                <div className="space-y-1">
                  <Heading level="3" size="xsmall">
                    Dokumenter i mappen
                  </Heading>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {open.app.resources
                      .filter((r) =>
                        /cv|søknadsbrev|cover|utlysning/i.test(r.name)
                      )
                      .slice(0, 4)
                      .map((r) => {
                        // Check if this is an "Utlysning.md" file - if so, link to listingUrl instead
                        const isUtlysning = /utlysning/i.test(r.name) && /\.md$/i.test(r.name);
                        const href = isUtlysning && open.app.listingUrl
                          ? open.app.listingUrl
                          : `/api/files?path=${encodeURIComponent(r.relativePath)}`;
                        
                        return (
                          <li key={r.relativePath}>
                            <a
                              href={href}
                              className="text-accent underline underline-offset-2"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {r.name}
                            </a>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


