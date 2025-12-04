import { loadCompetenceBank, parseCompetenceBank } from "../../lib/competence";
import { Heading, BodyShort, Panel, Tag } from "@navikt/ds-react";

export default function KompetansePage() {
  const content = loadCompetenceBank();
  const sections = parseCompetenceBank(content);

  return (
    <div className="space-y-8">
      <section>
        <BodyShort
          size="small"
          className="text-xs uppercase tracking-[0.25em] text-slate-500"
        >
          Kompetansebank
        </BodyShort>
        <Heading level="1" size="large" className="mt-2">
          Modultekster for søknader
        </Heading>
        <BodyShort size="small" className="mt-2 max-w-xl text-slate-600">
          Ferdige tekstblokker organisert etter kategori. Velg variant basert på
          bedriftskulturen og tilpass de siste 10% til utlysningen.
        </BodyShort>
      </section>

      <div className="space-y-8">
        {sections.map((section) => (
          <Panel key={section.id} border className="space-y-4">
            <div>
              <Heading level="2" size="small">
                {section.emoji} {section.title}
              </Heading>
            </div>

            <div className="space-y-6">
              {section.variants.map((variant, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-borderSoft/50 bg-slate-50/50 p-4"
                >
                  <div className="mb-2">
                    <Tag variant="neutral" size="small">
                      {variant.label}
                    </Tag>
                  </div>
                  <div
                    className="text-sm whitespace-pre-wrap text-slate-700"
                    dangerouslySetInnerHTML={{
                      __html: variant.content
                        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.+?)\*/g, "<em>$1</em>")
                        .replace(/`(.+?)`/g, "<code class='bg-slate-200 px-1 rounded text-xs'>$1</code>")
                    }}
                  />
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

