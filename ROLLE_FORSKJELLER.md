# Rollebasert Tilgang i Jobboversikt-appen

Dette dokumentet beskriver forskjellene mellom hvordan appen fungerer for ulike brukerroller.

---

## 📋 Oversikt over Roller

Appen har tre hovedroller:
1. **Client** - Jobbsøkeren (sluttbruker)
2. **Consultant** - Bemanningsbyrå/Organisasjon som hjelper klienter
3. **Admin** - Systemadministrator med full tilgang

---

## 👤 CLIENT (Bruker/Jobbsøker)

**Beskrivelse:** Person som aktivt søker jobb og bruker appen til å organisere sin jobbsøknadsprosess.

### 🔐 Tilgang og Navigasjon

**Tilgjengelige sider:**
- ✅ Oversikt (Dashboard)
- ✅ Søknader
- ✅ Ressurser
- ✅ Kompetanse
- ✅ Tips
- ✅ Tall (Statistikk)
- ❌ Admin (ingen tilgang)
- ❌ Klienter (ingen tilgang)

### 📊 Dashboard

**Overskrift:** "En rolig oversikt over alle søknadene dine"  
**Beskrivelse:** "Se hvor du er i prosessen, hva som er sendt, og hvilke muligheter som ligger foran deg."

**Spesielle funksjoner:**
- ✅ Viser drømmelista (selskaper brukeren drømmer om å jobbe hos)
- ✅ Viser egne mål og fremdrift
- ✅ Personlig statistikk og aktivitet

### 🛠️ Funksjoner

| Funksjonalitet | Tilgang |
|----------------|---------|
| Se egne søknader | ✅ |
| Legge til jobbutlysninger | ✅ |
| Opprette mapper og filer | ✅ |
| Oppdatere søknadsstatus (Intervju, Ansatt, Avslag) | ✅ |
| Se egne ressurser (CV-er, søknadsbrev, etc.) | ✅ |
| Se egne statistikk | ✅ |
| Se drømmelista | ✅ |
| Se andres søknader | ❌ |
| Se aggregerte statistikk | ❌ |
| Klient-switcher | ❌ |
| Administrere organisasjoner | ❌ |

### 🎯 Brukstilfeller

- Organisere egne jobbsøknader
- Holde oversikt over sendte søknader og intervjuer
- Forberede seg til intervjuer
- Spore fremdrift og statistikk
- Lagre ressurser og dokumenter

---

## 🏢 CONSULTANT (Organisasjon/Byrå)

**Beskrivelse:** Bemanningsbyråer eller organisasjoner (som NAV, Sens) som hjelper flere klienter med jobbsøking. Har tilgang til alle sine klienters data.

### 🔐 Tilgang og Navigasjon

**Tilgjengelige sider:**
- ✅ Oversikt (Dashboard)
- ✅ Søknader
- ✅ Ressurser
- ✅ Kompetanse
- ✅ Tips
- ✅ Tall (Statistikk)
- ✅ Admin (lesevisning)
- ✅ Klienter (oversikt)

### 📊 Dashboard

**Overskrift:** "Oversikt over alle klienters søknader"  
**Beskrivelse:** "Se hvor klientene er i prosessen, hva som er sendt, og hvilke muligheter som ligger foran dem."

**Spesielle funksjoner:**
- ❌ Ingen drømmelista (kun for klienter)
- ✅ Klient-switcher i header (bytte mellom klienter)
- ✅ Aggregerte statistikk over alle klienter

### 🛠️ Funksjoner

| Funksjonalitet | Tilgang |
|----------------|---------|
| Se alle klienters søknader | ✅ |
| Se alle klienters ressurser | ✅ |
| Se aggregerte statistikk | ✅ |
| Klient-switcher (bytte mellom klienter) | ✅ |
| Se klientliste | ✅ |
| Tilgang til klientens dashboard | ✅ |
| Legge til jobbutlysninger (for klienter) | ✅ |
| Oppdatere søknadsstatus | ✅ |
| Se Admin-panel (lesevisning) | ✅ |
| Opprette nye organisasjoner | ❌ |
| Redigere organisasjonsinnstillinger | ❌ |
| Se drømmelista | ❌ |
| Personlige mål og fremdrift | ❌ |

### 🎯 Brukstilfeller

- Overvåke alle klienters jobbsøknadsprosesser
- Hjelpe klienter med søknader og forberedelse
- Spore fremdrift over alle klienter
- Identifisere klienter som trenger ekstra oppfølging
- Generere rapporter og statistikk for organisasjonen

### 🔄 Klient-switcher

I header kan Consultant velge hvilken klient de vil se data for, eller "Alle klienter" for aggregerte data.

---

## 👑 ADMIN (Systemadministrator)

**Beskrivelse:** Full systemadministrator med tilgang til alt i systemet. Kan administrere organisasjoner og har full oversikt.

### 🔐 Tilgang og Navigasjon

**Tilgjengelige sider:**
- ✅ Oversikt (Dashboard)
- ✅ Søknader
- ✅ Ressurser
- ✅ Kompetanse
- ✅ Tips
- ✅ Tall (Statistikk)
- ✅ Admin (full tilgang)
- ✅ Klienter (oversikt)

### 📊 Dashboard

**Overskrift:** "Oversikt over alle klienters søknader"  
**Beskrivelse:** "Se hvor klientene er i prosessen, hva som er sendt, og hvilke muligheter som ligger foran dem."

**Spesielle funksjoner:**
- ✅ Se alle organisasjoner i systemet
- ✅ Klient-switcher (som Consultant)
- ✅ Aggregerte statistikk

### 🛠️ Funksjoner

| Funksjonalitet | Tilgang |
|----------------|---------|
| Alt Consultant kan gjøre | ✅ |
| Opprette nye organisasjoner | ✅ |
| Redigere organisasjonsinnstillinger | ✅ |
| Se alle organisasjoner | ✅ |
| Full administrasjon | ✅ |

### 🎯 Brukstilfeller

- Administrere hele systemet
- Opprette nye organisasjoner (bemanningsbyråer)
- Konfigurere systeminnstillinger
- Overvåke all aktivitet
- Troubleshooting og support

### 🏗️ Admin-panel

**Kun for Admin:**
- "Ny organisasjon" knapp
- Kan opprette nye organisasjoner med navn og slug

**For både Admin og Consultant:**
- Se liste over organisasjoner
- Se antall klienter per organisasjon
- Se organisasjonsinnstillinger (Auto CV, Auto Søknad, etc.)

---

## 📊 Sammenligningstabell

| Funksjon | Client | Consultant | Admin |
|----------|:------:|:----------:|:-----:|
| **Navigasjon** |
| Oversikt | ✅ | ✅ | ✅ |
| Søknader | ✅ | ✅ | ✅ |
| Ressurser | ✅ | ✅ | ✅ |
| Kompetanse | ✅ | ✅ | ✅ |
| Tips | ✅ | ✅ | ✅ |
| Tall | ✅ | ✅ | ✅ |
| Admin | ❌ | ✅ (lese) | ✅ (full) |
| Klienter | ❌ | ✅ | ✅ |
| **Data og Oversikt** |
| Se egne søknader | ✅ | ❌ | ❌ |
| Se alle klienters søknader | ❌ | ✅ | ✅ |
| Se egne ressurser | ✅ | ❌ | ❌ |
| Se alle klienters ressurser | ❌ | ✅ | ✅ |
| Se egne statistikk | ✅ | ❌ | ❌ |
| Se aggregerte statistikk | ❌ | ✅ | ✅ |
| Drømmelista | ✅ | ❌ | ❌ |
| Klient-switcher | ❌ | ✅ | ✅ |
| **Handlinger** |
| Legge til jobbutlysning | ✅ | ✅ | ✅ |
| Opprette mapper/filer | ✅ | ✅ | ✅ |
| Oppdatere søknadsstatus | ✅ | ✅ | ✅ |
| Se klientliste | ❌ | ✅ | ✅ |
| Opprette organisasjoner | ❌ | ❌ | ✅ |
| Redigere organisasjoner | ❌ | ❌ | ✅ |

---

## 🔐 Autentisering og Tilgang

### Login

- Alle brukere logger inn via `/login` siden
- Demo-brukere er forhåndsopprettet for testing
- Session-basert autentisering (sessionId i localStorage)

### Tilgangskontroll

- `AuthGuard` komponenten sikrer at kun innloggede brukere kan se innhold
- Rollesjekk på Admin- og Klienter-sidene
- Client-brukere redirectes hvis de prøver å aksessere Admin

---

## 🚧 Nåværende Begrensninger

**Viktig:** Per nå viser appen teknisk sett samme data for alle roller (alle søknader lastes fra samme mappe). 

Filtringen er implementert på UI-nivå:
- ✅ Tekster og overskrifter tilpasses basert på rolle
- ✅ Navigasjon viser/skjuler lenker basert på rolle
- ✅ Funksjoner vises/skjules basert på rolle
- ❌ Faktisk dataseparasjon er ikke fullt implementert (alle ser alle søknader)

### For Full Multi-Tenant Funksjonalitet

For å implementere full dataseparasjon må du:

1. **Koble klienter til organisasjoner**
   - Hver klient må ha en `organizationId`

2. **Koble søknader til klienter**
   - Hver søknad må ha en `clientId` eller `userId`
   - Søknader må lagres per klient/organisasjon

3. **Filtrere data basert på rolle**
   - Client: Se kun egne søknader (`clientId === user.id`)
   - Consultant: Se søknader for alle klienter i organisasjonen (`organizationId === user.organizationId`)
   - Admin: Se alle søknader

4. **Separate filstrukturer**
   - Eventuelt organisere mapper per klient/organisasjon
   - Eller lagre metadata i database som peker til riktige filer

---

## 📝 Demo-brukere

For testing er følgende demo-brukere opprettet:

| Email | Rolle | Beskrivelse |
|-------|-------|-------------|
| `admin@demo.no` | Admin | Systemadministrator |
| `konsulent@demo.no` | Consultant | Bemanningsbyrå-representant |
| `jessie.macharia@demo.no` | Client | Jobbsøker |

**Merk:** I demo-modus kreves ikke passord - kun e-post.

---

## 🔄 Eksempler på Bruksscenarioer

### Scenario 1: Jobbsøker (Client)
1. Logger inn som `jessie.macharia@demo.no`
2. Ser dashboard med egne søknader
3. Legger til ny jobbutlysning
4. Får automatisk mappe og filer opprettet
5. Ser drømmelista og personlige mål
6. Oppdaterer status etter intervju

### Scenario 2: Bemanningsbyrå (Consultant)
1. Logger inn som `konsulent@demo.no`
2. Ser dashboard med alle klienters søknader
3. Bruker klient-switcher for å se spesifikk klient
4. Går til Admin-panel for å se organisasjonsoversikt
5. Går til Klienter-siden for å se alle klienter
6. Ser aggregerte statistikk over alle klienter

### Scenario 3: Systemadmin (Admin)
1. Logger inn som `admin@demo.no`
2. Har samme visning som Consultant
3. Går til Admin-panel
4. Oppretter ny organisasjon (f.eks. "NAV Asker")
5. Konfigurerer organisasjonsinnstillinger
6. Overvåker alle organisasjoner og klienter

---

## 📚 Relaterte Dokumenter

- `README_MULTI_TENANT.md` - Teknisk dokumentasjon for multi-tenant arkitektur
- `README_DEMO_USERS.md` - Informasjon om demo-brukere
- `.cursor/rules/jobbstrategi.mdc` - Strategi for analyse av selskaper og jobbmuligheter

---

*Dokumentet sist oppdatert: Desember 2024*







