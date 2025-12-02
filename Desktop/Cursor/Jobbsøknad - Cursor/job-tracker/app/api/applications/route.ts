import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface Application {
  company: string;
  position: string;
  status: 'planned' | 'inProgress' | 'sent';
  deadline?: string;
  location?: string;
  folderPath?: string;
}

export async function GET() {
  try {
    // Naviger til data-mappen (public/data i produksjon/dev etter copy-script)
    const dataDir = path.join(process.cwd(), 'public', 'data', '02_Søknader');
    
    // Fallback for lokal utvikling uten copy-script (direkte til kilden)
    const localSource = path.join(process.cwd(), '..', 'Jobb_Søknad_Pakke', '02_Søknader');
    const localSourceAlt = path.join(process.cwd(), '..', '02_Søknader');

    const possiblePaths = [
      dataDir,
      localSource,
      localSourceAlt
    ];

    let baseDir = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        baseDir = p;
        break;
      }
    }

    if (!baseDir) {
      console.error('Could not find 02_Søknader directory in:', possiblePaths);
      return NextResponse.json({ error: 'Data directory not found', searched: possiblePaths }, { status: 404 });
    }

    const applications: Application[] = [];
    
    // Get applications from "Alle selskaper"
    const companiesDir = path.join(baseDir, 'Alle selskaper');
    
    if (fs.existsSync(companiesDir)) {
      const companies = fs.readdirSync(companiesDir);
      
      companies.forEach(company => {
        const companyPath = path.join(companiesDir, company);
        
        if (!fs.statSync(companyPath).isDirectory()) return;
        
        const files = fs.readdirSync(companyPath);
        
        // Check if PDFs exist for both CV and cover letter
        const hasCVPdf = files.some(f => f.includes('CV') && f.endsWith('.pdf'));
        const hasCoverPdf = files.some(f => (f.includes('Søknadsbrev') || f.includes('Cover Letter') || f.includes('Søknad')) && f.endsWith('.pdf'));
        
        let status: 'planned' | 'inProgress' | 'sent' = 'inProgress';
        if (hasCVPdf && hasCoverPdf) {
          status = 'sent';
        }
        
        // Try to find job listing for metadata
        const listingFile = files.find(f => f.endsWith('.md') && !f.includes('CV') && !f.includes('Søknad'));
        let deadline = '';
        let location = '';
        let position = 'Ukjent stilling';
        
        if (listingFile) {
          try {
            const content = fs.readFileSync(path.join(companyPath, listingFile), 'utf-8');
            const { content: markdown } = matter(content);
            
            // Parse markdown for metadata
            const lines = markdown.split('\n');
            for (const line of lines) {
              if (line.includes('Frist:')) deadline = line.split('Frist:')[1]?.trim().replace(/\*/g, '') || '';
              if (line.includes('Sted:')) location = line.split('Sted:')[1]?.trim().replace(/\*/g, '') || '';
            }
            
            // Get position from first heading
            const headingMatch = markdown.match(/^#\s+(.+)/m);
            if (headingMatch) position = headingMatch[1];
          } catch (err) {
            console.error(`Error reading ${listingFile}:`, err);
          }
        }
        
        applications.push({
          company,
          position,
          status,
          deadline,
          location,
          folderPath: companyPath
        });
      });
    }
    
    // Get planned applications
    const plannedDir = path.join(baseDir, 'Planlagte_Søknader');
    if (fs.existsSync(plannedDir)) {
      const plannedFiles = fs.readdirSync(plannedDir).filter(f => f.endsWith('.md') && f !== '.readme');
      
      plannedFiles.forEach(file => {
        try {
          const content = fs.readFileSync(path.join(plannedDir, file), 'utf-8');
          const { content: markdown } = matter(content);
          
          const company = file.replace('.md', '').replace(/_/g, ' ');
          let deadline = '';
          let location = '';
          let position = 'Ukjent stilling';
          
          const lines = markdown.split('\n');
          for (const line of lines) {
            if (line.includes('Frist:')) deadline = line.split('Frist:')[1]?.trim().replace(/\*/g, '') || '';
            if (line.includes('Sted:')) location = line.split('Sted:')[1]?.trim().replace(/\*/g, '') || '';
          }
          
          const headingMatch = markdown.match(/^#\s+(.+)/m);
          if (headingMatch) position = headingMatch[1];
          
          // Only add if not already in applications (avoid duplicates)
          if (!applications.find(a => a.company === company)) {
            applications.push({
              company,
              position,
              status: 'planned',
              deadline,
              location,
              folderPath: path.join(plannedDir, file)
            });
          }
        } catch (err) {
          console.error(`Error reading ${file}:`, err);
        }
      });
    }
    
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
