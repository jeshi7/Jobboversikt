
## 🌍 Deling og Deploy

For å dele denne applikasjonen med andre via Vercel:

1.  **Last opp til GitHub**:
    -   Initialiser git-repoet (allerede gjort).
    -   Push koden til et privat repository på GitHub.

2.  **Deploy til Vercel**:
    -   Logg inn på Vercel og velg "Add New Project".
    -   Importer repoet fra GitHub.
    -   **Root Directory**: Velg `job-tracker` (viktig!).
    -   **Framework Preset**: Next.js (bør velges automatisk).
    -   Trykk **Deploy**.

Appen vil automatisk kopiere dataene fra `Jobb_Søknad_Pakke` under byggeprosessen, slik at de blir tilgjengelige i den deployede versjonen.
