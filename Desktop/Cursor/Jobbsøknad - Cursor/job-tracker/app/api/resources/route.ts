import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Resource {
  name: string;
  path: string;
  icon: string;
  description: string;
}

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), '..', 'Jobb_Søknad_Pakke', '01_Ressurser');
    const resources: Resource[] = [];

    if (!fs.existsSync(baseDir)) {
      return NextResponse.json(resources);
    }

    const resourceMap: Record<string, { icon: string; description: string }> = {
      'Min_Profil_Analyse.md': {
        icon: 'profile',
        description: 'Din personlige profil, styrker, svakheter og USP'
      },
      'Kompetansebank.md': {
        icon: 'competence',
        description: 'Modultekster for ulike ferdigheter og scenarioer'
      },
      'Prosjektbeskrivelser.md': {
        icon: 'projects',
        description: 'STAR-beskrivelser av tidligere prosjekter'
      },
      'Intervju_Forberedelser.md': {
        icon: 'interview',
        description: 'Forberedelse til intervjuer og vanlige spørsmål'
      },
      'Drømmeliste_og_Nettverk.md': {
        icon: 'network',
        description: 'Målbedrifter og nettverksstrategi'
      }
    };

    const files = fs.readdirSync(baseDir);

    files.forEach(file => {
      if (file.endsWith('.md') && resourceMap[file]) {
        const filePath = path.join(baseDir, file);
        resources.push({
          name: file.replace('.md', '').replace(/_/g, ' '),
          path: filePath,
          icon: resourceMap[file].icon,
          description: resourceMap[file].description
        });
      }
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

