"use client";

import { useState, useEffect } from "react";
import { Panel, BodyShort, Heading } from "@navikt/ds-react";

const quotes = [
  "Jobbsøking er en prosess, ikke et race. Hver søknad er et skritt fremover.",
  "Du er ikke bare på jakt etter en jobb - du finner den rette stedet for deg.",
  "Hver avslag er én nærmere et ja. Hold ut!",
  "Den som søker, finner. Du gjør jobben din, og det betyr noe.",
  "Jobbsøking er som å plante frø. Det tar tid før de spirer, men de spirer.",
  "Din verdi er ikke definert av svarene du får, men av innsatsen du gir.",
];

export function MotivationQuote() {
  const [quote, setQuote] = useState<string>("");

  useEffect(() => {
    // Pick a random quote, but try to vary it based on day
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % quotes.length;
    setQuote(quotes[index]);
  }, []);

  if (!quote) return null;

  return (
    <Panel border className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <Heading level="3" size="xsmall" className="text-slate-700 mb-2">
        💭 Tanke for dagen
      </Heading>
      <BodyShort size="small" className="text-slate-700 italic">
        "{quote}"
      </BodyShort>
    </Panel>
  );
}







