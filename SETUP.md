# Jobboversikt - Oppsett

Denne guiden forklarer hvordan du setter opp Jobboversikt for produksjon.

## 1. Opprett Supabase-prosjekt

1. Gå til [supabase.com](https://supabase.com) og logg inn/registrer deg
2. Klikk "New project"
3. Velg et navn (f.eks. "jobboversikt") og passord
4. Velg region nær deg (Frankfurt for Norge)
5. Vent til prosjektet er opprettet (~2 minutter)

## 2. Kjør database-schema

1. I Supabase Dashboard, gå til **SQL Editor**
2. Klikk "New query"
3. Kopier og lim inn innholdet fra `supabase/schema.sql`
4. Klikk "Run" for å opprette alle tabeller

## 3. Opprett Storage bucket

1. Gå til **Storage** i venstre meny
2. Klikk "New bucket"
3. Navn: `documents`
4. Velg **Private** (ikke public)
5. Klikk "Create bucket"

## 4. Hent API-nøkler

1. Gå til **Project Settings** > **API**
2. Kopier disse verdiene:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 5. Konfigurer Vercel

1. Gå til [vercel.com](https://vercel.com) og åpne prosjektet
2. Gå til **Settings** > **Environment Variables**
3. Legg til disse variablene:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Din Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Din Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Din Supabase service role key |

4. Klikk "Save"
5. **Redeploy** prosjektet for at endringene skal tre i kraft

## 6. Første gangs oppsett

1. Gå til appen din (f.eks. `https://din-app.vercel.app`)
2. Du vil automatisk bli sendt til `/setup`
3. Opprett din organisasjon og admin-bruker
4. Du er klar!

## Flere organisasjoner

Hver organisasjon i Jobboversikt er helt uavhengig med fullstendig dataseparasjon:
- Brukere ser kun data fra sin egen organisasjon
- Admins kan bare administrere brukere i sin organisasjon
- Data deles aldri mellom organisasjoner

### Opprette ny organisasjon

For å opprette en ny, uavhengig organisasjon:

1. Gå til **Supabase Dashboard** > **SQL Editor**
2. Kjør denne SQL-kommandoen:

```sql
-- Opprett ny organisasjon
INSERT INTO organizations (name) VALUES ('Organisasjonsnavn');

-- Finn ID-en til den nye organisasjonen
SELECT id FROM organizations WHERE name = 'Organisasjonsnavn';
```

3. Kopier ID-en og opprett en admin-bruker:

```sql
-- Opprett admin-bruker (bytt ut verdiene)
INSERT INTO users (organization_id, email, name, role, password_hash, must_change_password)
VALUES (
  'ORGANISASJONS-ID-HER',
  'admin@eksempel.no',
  'Admin Navn',
  'admin',
  -- SHA256 hash av passordet (bruk en online hasher)
  'SHA256_HASH_AV_PASSORD',
  true
);
```

4. Den nye admin-brukeren kan nå logge inn og opprette flere brukere via admin-panelet.

## Lokal utvikling

For lokal utvikling, opprett en `.env.local` fil:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Kjør deretter:

```bash
npm run dev
```

## Feilsøking

### "Database ikke konfigurert"
- Sjekk at alle miljøvariabler er satt korrekt
- Sjekk at Supabase-prosjektet er aktivt

### "Appen må settes opp først"
- Gå til `/setup` for å opprette første organisasjon og admin

### Filer lastes ikke opp
- Sjekk at `documents` bucket er opprettet i Supabase Storage
- Sjekk at storage policies er satt opp (se `supabase/schema.sql`)

## Sikkerhet

- **Aldri** del `SUPABASE_SERVICE_ROLE_KEY` offentlig
- Denne nøkkelen gir full tilgang til databasen
- Hold den kun på server-siden (ikke i `NEXT_PUBLIC_` variabler)

