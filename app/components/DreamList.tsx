"use client";

import { useState } from "react";
import { Heading, BodyShort, Button, Tag } from "@navikt/ds-react";

interface DreamCompany {
  id: string;
  name: string;
  category: string;
  angle: string;
}

interface Props {
  companies: DreamCompany[];
  grouped: Record<string, DreamCompany[]>;
}

export function DreamList({ companies, grouped }: Props) {
  const [selected, setSelected] = useState<DreamCompany | null>(null);

  const categories = Object.keys(grouped);

  return (
    <>
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <BodyShort size="small" className="mb-2 font-medium text-slate-600">
              {category}
            </BodyShort>
            <div className="flex flex-wrap gap-2">
              {grouped[category].map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelected(company)}
                  className="rounded-lg border border-borderSoft/70 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:border-accent hover:bg-accent/5"
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Popup modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-5 shadow-subtle"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Heading level="2" size="small">
                  {selected.name}
                </Heading>
                <Tag
                  variant="neutral"
                  size="small"
                  className="mt-2"
                >
                  {selected.category}
                </Tag>
              </div>
              <Button
                variant="tertiary"
                size="xsmall"
                onClick={() => setSelected(null)}
              >
                Lukk
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <Heading level="3" size="xsmall">
                  Din vinkel
                </Heading>
                <BodyShort size="small" className="text-slate-700">
                  {selected.angle || "Ingen vinkel definert ennå."}
                </BodyShort>
              </div>

              <div className="space-y-1">
                <Heading level="3" size="xsmall">
                  Tips
                </Heading>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>• Sjekk karrieresiden deres jevnlig</li>
                  <li>• Finn kontaktpersoner på LinkedIn</li>
                  <li>• Lag en skreddersydd spontansøknad</li>
                  <li>• Tenk på hvem i nettverket ditt som kan introdusere deg</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  as="a"
                  href={`https://www.google.com/search?q=${encodeURIComponent(selected.name + " karriere jobb")}`}
                  target="_blank"
                  rel="noreferrer"
                  size="small"
                  variant="secondary"
                >
                  Søk etter jobber
                </Button>
                <Button
                  as="a"
                  href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(selected.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  size="small"
                >
                  Finn på LinkedIn
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

