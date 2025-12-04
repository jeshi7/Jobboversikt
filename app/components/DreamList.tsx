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

function getTailoredTips(company: DreamCompany): string[] {
  const cat = company.category.toLowerCase();
  const name = company.name;

  // Outdoor / Lifestyle
  if (cat.includes("outdoor") || cat.includes("lifestyle")) {
    return [
      `Vis frem visuell storytelling - ${name} lever av sterke bilder og følelser`,
      "Lag et moodboard som matcher deres premium-estetikk og send det med søknaden",
      "Trekk frem erfaring med merkevarebygging og helhetlig visuell identitet",
      "Din bakgrunn fra service viser at du forstår kundeopplevelsen - bruk det aktivt",
    ];
  }

  // Tech / UX / Produkt
  if (cat.includes("tech") || cat.includes("ux") || cat.includes("produkt")) {
    return [
      "Fokuser på UX-tankesettet ditt - brukerreiser, friksjon og innsikt",
      `${name} verdsetter folk som forstår både design og kode - vis at du kan snakke med utviklere`,
      "Trekk frem AI-verktøyene du bruker og hvordan de gjør deg mer effektiv",
      "Din erfaring med universell utforming fra NAV er gull verdt her",
    ];
  }

  // Media / Produksjon / Innhold
  if (cat.includes("media") || cat.includes("produksjon") || cat.includes("innhold")) {
    return [
      "Vis at du kan levere under press - de jobber med stramme frister",
      `Send en kort video-pitch eller redigert demo til ${name} - vis frem produksjonsferdighetene`,
      "Trekk frem din evne til å jobbe med tekst OG bilde - du er en hybrid",
      "Din fortellerstemme er din styrke - bruk den i søknaden",
    ];
  }

  // Designbyråer / Konsulenthus
  if (cat.includes("byrå") || cat.includes("konsulent") || cat.includes("design")) {
    return [
      `${name} ser etter folk som tåler høyt tempo - vis at du trives når det koker`,
      "Lag en case-studie av et tidligere prosjekt som viser prosess, ikke bare resultat",
      "Din tverrfaglige profil (design + tech + innhold) passer perfekt for byråmodellen",
      "Vis at du kan både ta imot og gi feedback - iterasjon er livsnerven i byrå",
    ];
  }

  // In-house / Store merkevarer
  if (cat.includes("in-house") || cat.includes("merkevare")) {
    return [
      `${name} har etablerte systemer - vis at du kan jobbe innenfor rammer og bygge videre`,
      "Trekk frem din erfaring med designsystemer og struktur",
      "Store selskaper verdsetter lagspillere - bruk fotball-metaforen din",
      "Foreslå en konkret forbedring du ser på deres digitale flater",
    ];
  }

  // Retail / E-commerce
  if (cat.includes("retail") || cat.includes("e-commerce") || cat.includes("handel")) {
    return [
      "Snakk om konvertering og hvordan design påvirker kjøpsbeslutninger",
      `${name} trenger folk som produserer raskt - vis at du kan levere volum uten å miste kvalitet`,
      "Din forståelse for SEO og synlighet er relevant her - trekk det frem",
      "Foreslå en A/B-test eller forbedring basert på deres nåværende nettside",
    ];
  }

  // Kultur / Event / Opplevelser
  if (cat.includes("kultur") || cat.includes("event") || cat.includes("opplevelse")) {
    return [
      `${name} handler om følelser og opplevelser - vis at du forstår dramaturgien`,
      "Din bakgrunn fra hotell og service er direkte overførbar - 'live UX'",
      "Lag en visuell pitch som viser hvordan du ville kommunisert en av deres opplevelser",
      "Trekk frem evnen din til å jobbe med både det digitale og det fysiske",
    ];
  }

  // Fallback for unknown categories
  return [
    `Undersøk ${name} sin kultur og tilpass søknaden til deres tone`,
    "Vis frem din hybridkompetanse - design, innhold og teknisk forståelse",
    "Bruk din autentiske stemme - den skiller deg fra andre søkere",
    "Lag noe konkret som viser hva du kan tilføre dem",
  ];
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
                  Tips tilpasset {selected.name}
                </Heading>
                <ul className="space-y-1 text-sm text-slate-600">
                  {getTailoredTips(selected).map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
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

