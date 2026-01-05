# Multi-Tenant Jobbøknad App - Dokumentasjon

## Oversikt

Denne appen er omstrukturert til en multi-tenant løsning for bemanningsbyråer og organisasjoner som NAV eller Sens som hjelper folk med å få jobb.

## Nye funksjoner

### 1. Multi-Tenancy
- Flere organisasjoner kan bruke appen samtidig
- Hver organisasjon har sin egen data og innstillinger
- Data isoleres per organisasjon

### 2. Agent-System
Appen har tre hovedagenter som automatisérer arbeidsflyten:

#### a) CV-Parser Agent (`lib/agents/cv-parser.ts`)
- Parser CV-filer og ekstraherer automatisk:
  - Ferdigheter/kompetanse
  - Arbeidserfaring
  - Utdanning
  - Språk
- Bygger kompetansebank automatisk

#### b) Content Generator Agent (`lib/agents/content-generator.ts`)
- Genererer CV-profil basert på kompetansebank + utlysning
- Genererer søknadsbrev automatisk
- Matcher relevant erfaring og kompetanse mot stillingen

#### c) Folder Setup Agent (`lib/agents/folder-setup.ts`)
- Oppretter automatisk mapper og filer ved nye utlysninger
- Konfigurerbart per organisasjon (auto-generer CV/søknad eller ikke)

### 3. Kompetansebank
- Strukturert lagring av all kompetanse per klient
- Brukes som grunnlag for automatisk generering av CV-profil og søknadsbrev
- Oppdateres automatisk når nye CV-er lastes opp

## API Endpoints

### Organisasjoner
- `GET /api/organizations` - Liste alle organisasjoner
- `GET /api/organizations?id=xxx` - Hent spesifikk organisasjon
- `GET /api/organizations?slug=xxx` - Hent organisasjon via slug
- `POST /api/organizations` - Opprett ny organisasjon

### Klienter
- `GET /api/clients?organizationId=xxx` - Liste klienter for organisasjon
- `GET /api/clients?id=xxx` - Hent spesifikk klient
- `POST /api/clients` - Opprett ny klient

### Kompetansebank
- `GET /api/competence-banks?id=xxx` - Hent kompetansebank
- `GET /api/competence-banks?clientId=xxx` - Hent kompetansebank for klient
- `POST /api/competence-banks` - Opprett ny kompetansebank
- `PATCH /api/competence-banks` - Oppdater kompetansebank

### Agenter
- `POST /api/agents/parse-cv` - Parse CV og bygg kompetansebank
- `POST /api/agents/generate-content` - Generer CV-profil og søknadsbrev
- `POST /api/agents/setup-folder` - Opprett mappe og filer for ny utlysning

## Bruk

### For organisasjoner (bemanningsbyråer):

1. **Opprett organisasjon** (via `/admin`):
   - Navn: "NAV Sarpsborg"
   - Slug: "nav-sarpsborg"
   - Konfigurer auto-generering innstillinger

2. **Opprett klient**:
   ```json
   POST /api/clients
   {
     "organizationId": "org-xxx",
     "name": "Ola Nordmann",
     "email": "ola@example.com"
   }
   ```

3. **Last opp CV** (via klient-side `/clients/[id]`):
   - CV-parser agenten ekstraherer automatisk kompetanse
   - Kompetansebank opprettes automatisk

4. **Legg inn utlysning**:
   - Lim inn utlysningstekst
   - Klikk "Generer CV-profil & Søknadsbrev"
   - Agenter genererer innhold automatisk
   - Klikk "Opprett mappe & filer" for å opprette filstruktur

### Automatiserte arbeidsflyter

Når en organisasjon har aktivert auto-generering:
- Nye utlysninger → automatisk mappe opprettelse
- CV-profil genereres automatisk basert på kompetansebank
- Søknadsbrev genereres automatisk matchet mot stilling

## Datastruktur

Data lagres i `.data/` mappen:
- `.data/organizations/` - Organisasjonsdata (JSON)
- `.data/users/` - Brukerdata (JSON)
- `.data/clients/` - Klientdata (JSON)
- `.data/competenceBanks/` - Kompetansebanker (JSON)

## Fremtidige forbedringer

1. **Autentisering & Autorisation**
   - Innlogging per organisasjon
   - Roller: Admin, Consultant, Client
   - Sessions og tokens

2. **Forbedret CV-parsing**
   - Bedre PDF-parsing (f.eks. med pdf-parse bibliotek)
   - OCR for scannede CV-er
   - Støtte for flere formater

3. **Forbedret Content Generation**
   - Bruk av LLM (f.eks. OpenAI GPT) for bedre tekstgenerering
   - Template-system for ulike bransjer
   - Personlig tilpasning basert på organisasjons-preferanser

4. **Dashboard per klient**
   - Klienter kan se egne søknader
   - Tracking av søknadsstatus
   - Kommunikasjon med konsulenter

5. **Integrasjoner**
   - Integrasjon med jobbportaler (finn.no, LinkedIn)
   - E-post integrasjon for sending av søknader
   - Kalender-integrasjon for intervjuer

6. **Rapportering**
   - Statistikk per organisasjon
   - Suksessrate tracking
   - Tidsbruk per klient

## Tekniske notater

- Data lagres i JSON-filer (kan migreres til database senere)
- Agentene kan enkelt utvides med LLM-integrasjon
- Multi-tenant struktur gjør det enkelt å tilby som SaaS







