import { Heading, BodyShort, Panel, Tag } from "@navikt/ds-react";

export default function TipsPage() {
  return (
    <div className="space-y-8">
      <section>
        <BodyShort
          size="small"
          className="text-xs uppercase tracking-[0.25em] text-slate-500"
        >
          Jobbsøking i Norge
        </BodyShort>
        <Heading level="1" size="large" className="mt-2">
          Tips og ressurser
        </Heading>
        <BodyShort size="small" className="mt-2 max-w-xl text-slate-600">
          En guide til å gjøre jobbsøknadsprosessen mer effektiv og oversiktlig.
          Fra kartlegging av kompetanse til oppfølging etter søknad.
        </BodyShort>
      </section>

      <div className="space-y-6">
        {/* Kartlegging av kompetanse */}
        <Panel border className="space-y-4">
          <div className="flex items-center gap-2">
            <Heading level="2" size="medium">
              🎯 Kartlegging av kompetanse
            </Heading>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Identifiser dine styrker
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Start med å kartlegge hva du faktisk kan. Tenk gjennom prosjekter,
                oppgaver og erfaringer. Hva har du lært? Hva gjør du godt? Skriv
                det ned - det blir lettere å finne ordene senere.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Bruk EURES for å se hva som etterspørres
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                EURES gir innsikt i hvilke ferdigheter som er etterspurt i
                arbeidsmarkedet. Sjekk hva som matcher din bakgrunn og hva du
                kanskje bør lære mer om.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Jobbkartet fra Utdanning.no
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Se hvor folk jobber i ulike yrker og hvor det er vekst. Dette
                kan hjelpe deg med å identifisere relevante stillinger og
                regioner.
              </BodyShort>
            </div>
          </div>
        </Panel>

        {/* CV og søknad */}
        <Panel border className="space-y-4">
          <div className="flex items-center gap-2">
            <Heading level="2" size="medium">
              📝 Oppretting av CV og søknad
            </Heading>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Tilpass hver søknad
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Skriv aldri én generell søknad. Les utlysningen grundig og vis
                hvordan din bakgrunn matcher akkurat denne stillingen. Fokuser
                på det de faktisk trenger, ikke alt du har gjort.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Bruk norsk (med mindre annet er spesifisert)
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                De fleste stillinger i Norge krever norskkunnskaper. Skriv CV
                og søknad på norsk, selv om du er usikker. Det viser at du tar
                språket på alvor.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Maler og eksempler
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                CVmaler.no, CVguru.no og Jobbsøknader.no tilbyr maler og
                eksempler. Men husk: maler er utgangspunkt, ikke sluttresultat.
                Tilpass til deg.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Vis ambisjon og motivasjon
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Fortell ikke bare hva du har gjort, men hvorfor du vil jobbe
                akkurat her. Hva får deg til å brenne for denne stillingen?
                Det er forskjellen mellom en søknad og en god søknad.
              </BodyShort>
            </div>
          </div>
        </Panel>

        {/* Organisering */}
        <Panel border className="space-y-4">
          <div className="flex items-center gap-2">
            <Heading level="2" size="medium">
              📁 Organisering av data
            </Heading>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Hold oversikt over søknader
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Bruk en mappestruktur eller et verktøy som Jobseeker for å
                spore hvilke søknader du har sendt, når du sendte dem, og
                status. Det blir fort rotete uten system.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Lagre kontakter
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Noter navn, stilling, e-post og telefonnummer for alle du
                kontakter. Legg også til dato for når du tok kontakt og hva du
                snakket om. Du glemmer det ellers.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Bruk kalender for frister
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Sett opp påminnelser for søknadsfrister, oppfølging og
                intervjuer. Det er lett å glemme når det er mange baller i
                luften.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Versjonskontroll på dokumenter
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Lagre ulike versjoner av CV og søknadsbrev. Navngi dem tydelig
                (f.eks. "CV - Designbyrå.pdf" eller "Søknad - NAV.pdf"). Du
                vil takke deg selv senere.
              </BodyShort>
            </div>
          </div>
        </Panel>

        {/* Kontakt med arbeidsgiver */}
        <Panel border className="space-y-4">
          <div className="flex items-center gap-2">
            <Heading level="2" size="medium">
              📞 Kontakt med arbeidsgiver
            </Heading>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Oppfølging etter søknad
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Det er greit å følge opp etter 1-2 uker hvis du ikke har hørt
                noe. Send en kort, høflig e-post der du viser at du fortsatt er
                interessert. Ikke press for hardt, men vis engasjement.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Vær punktlig
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Nordmenn verdsetter punktlighet. Kom i god tid til intervjuer,
                svar på e-poster innen rimelig tid, og hold avtaler. Det er
                grunnleggende, men viktig.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Spør smarte spørsmål
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Når de spør om du har spørsmål, ha noen klare. Det viser at du
                har tenkt gjennom stillingen og er genuint interessert. Ikke
                bare "Nei, alt er klart."
              </BodyShort>
            </div>
          </div>
        </Panel>

        {/* Tidsrammer */}
        <Panel border className="space-y-4">
          <div className="flex items-center gap-2">
            <Heading level="2" size="medium">
              ⏰ Tidsrammer
            </Heading>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Når kan du forvente svar?
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Mange bedrifter tar 2-4 uker på å behandle søknader. Hvis det
                går lenger, er det greit å følge opp. Men ikke send oppfølging
                etter 3 dager - det virker desperat.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Intervjuprosess
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Mange stillinger har flere runder med intervjuer. Det kan ta
                flere uker fra første kontakt til tilbud. Hold ut, og ikke
                anta at stillingen er borte bare fordi det tar tid.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Planlegg tid til søknader
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                En god søknad tar tid. Sett av 2-4 timer per søknad for å lese
                utlysningen grundig, tilpasse CV og skrive et godt
                søknadsbrev. Hastverk er ikke bra.
              </BodyShort>
            </div>
          </div>
        </Panel>

        {/* Jobbportaler og ressurser */}
        <Panel border className="space-y-4">
          <div className="flex items-center gap-2">
            <Heading level="2" size="medium">
              🌐 Jobbportaler og ressurser
            </Heading>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                NAVs stillingsportal
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Den offisielle arbeidsformidlingen. Abonner på søk og få varsler
                om nye stillinger. Mange bedrifter legger ut stillinger her
                først.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                FINN.no
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                En av Norges største markedsplasser med et bredt utvalg av
                stillingsannonser. Sjekk jevnlig og sett opp varsler.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Jobbnorge og Karriere.no
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Spesialiserte jobbportaler som samler stillinger fra ulike
                kilder. Karriere.no lar deg også opprette en digital CV.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Jobbportaler.no
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                En oversikt over de fleste jobbportaler, rekrutteringsbyråer og
                bemanningsselskaper i Norge. Nyttig for å finne relevante
                kanaler.
              </BodyShort>
            </div>
          </div>
        </Panel>

        {/* Nettverksbygging */}
        <Panel border className="space-y-4">
          <div className="flex items-center gap-2">
            <Heading level="2" size="medium">
              🤝 Nettverksbygging
            </Heading>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                LinkedIn
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Oppdater profilen din, følg relevante bedrifter, og engasjer deg
                i diskusjoner. Mange stillinger fylles gjennom nettverk, ikke
                bare offentlige utlysninger.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Sammen om en jobb
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                En frivillig organisasjon som kobler jobbsøkere med mentorer fra
                samme utdanningsbakgrunn. De tilbyr også nettverk, kurs og
                verktøy.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Faglige fellesskap
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Delta i relevante nettverk og faglige organisasjoner. Møt folk,
                del kunnskap, og bygg relasjoner. Det er ofte her mulighetene
                ligger.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Workshops og kurs
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Caritas Stavanger og andre organisasjoner arrangerer gratis
                workshops om jobbsøking, CV-skriving og intervjuteknikker. Dra
                på dem - du lærer mye og møter folk.
              </BodyShort>
            </div>
          </div>
        </Panel>

        {/* Andre tips */}
        <Panel border className="space-y-4">
          <div className="flex items-center gap-2">
            <Heading level="2" size="medium">
              💡 Andre tips
            </Heading>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Lær deg norsk
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                De fleste stillinger krever norskkunnskaper. Ta kurs, snakk med
                folk, og bruk språket aktivt. Det er en investering som lønner
                seg.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Forstå arbeidskulturen
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Norsk arbeidsliv verdsetter flat struktur, balanse mellom jobb
                og fritid, og direkte kommunikasjon. Sett deg inn i kulturen -
                det hjelper både i søknaden og på jobben.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Praksisplasser
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Mange selskaper tilbyr praksisprogrammer (Accenture, DNB
                Markets, Yara). Det kan være en vei inn i arbeidslivet, spesielt
                for nyutdannede.
              </BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                Hold ut
              </BodyShort>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Jobbsøking kan være slitsomt. Det er normalt å få avslag. Lær
                av hver søknad, juster tilnærmingen, og ikke gi opp. Den rette
                stillingen finnes der ute.
              </BodyShort>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}















