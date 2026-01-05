# Demo Brukere

## Innlogging

I demo-versjonen kreves ingen passord. Du logger inn kun med e-post.

## Demo-kontoer

### 1. Administrator
- **E-post:** `admin@demo.no`
- **Passord:** Ingen (demo)
- **Rolle:** Admin
- **Tilgang:** Full tilgang til alle funksjoner og organisasjoner

### 2. Konsulent
- **E-post:** `konsulent@demo.no`
- **Passord:** Ingen (demo)
- **Rolle:** Consultant
- **Tilgang:** Kan se og administrere alle klienter i sin organisasjon

### 3. Klient (Jessie Macharia)
- **E-post:** `jessie.macharia@demo.no`
- **Passord:** Ingen (demo)
- **Rolle:** Client
- **Tilgang:** Ser kun sin egen data

## Organisasjoner

### NAV Sarpsborg
- **Slug:** `nav-sarpsborg`
- **Brukere:** Alle demo-brukerne over tilhører denne organisasjonen

## Auto-generering

Demo-brukerne opprettes automatisk første gang du prøver å logge inn hvis det ikke finnes noen brukere i systemet.

## Manuell seeding

Hvis du vil seede demo-data manuelt, kan du kjøre:

```bash
npx tsx scripts/seed-demo-users.ts
```

eller legge til et script i `package.json`:

```json
{
  "scripts": {
    "seed": "tsx scripts/seed-demo-users.ts"
  }
}
```







