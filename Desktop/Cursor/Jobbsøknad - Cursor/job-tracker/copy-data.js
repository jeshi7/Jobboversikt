const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');

const SOURCE_DIR = path.join(__dirname, '..', 'Jobb_Søknad_Pakke');
const PUBLIC_DATA_DIR = path.join(__dirname, 'public', 'data');
const MANIFEST_PATH = path.join(__dirname, 'app', 'data-manifest.json');

const SANITIZE_REGEX = /[^a-z0-9æøåäö]/gi;

const stripFormatting = (value = '') =>
  value
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/_/g, ' ')
    .replace(/[✉️📝✅❌]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeKey = (value = '') =>
  stripFormatting(value)
    .toLowerCase()
    .replace(SANITIZE_REGEX, '');

async function parseOverview() {
  const overviewPath = path.join(SOURCE_DIR, '00_Oversikt', 'Søknadsoversikt.md');
  if (!(await fs.pathExists(overviewPath))) {
    return {};
  }

  const content = await fs.readFile(overviewPath, 'utf-8');
  const lines = content.split('\n');
  const headerIndex = lines.findIndex((line) => line.includes('| Bedrift |'));
  if (headerIndex === -1) {
    return {};
  }

  const overview = {};

  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('|')) break;
    if (line.startsWith('| - |')) break;

    const rawCells = line.split('|').map((cell) => cell.trim());
    if (rawCells.length < 16) continue;

    const cells = rawCells.slice(1, -1).map(stripFormatting);
    if (!cells[0] || cells[0] === '-') continue;

    const [
      company,
      position,
      form,
      percentage,
      location,
      deadline,
      status,
      contactPerson,
      notes,
      contact1,
      contact2,
      interview1,
      interview2,
      offer,
    ] = cells;

    const key = normalizeKey(company);
    overview[key] = {
      company: stripFormatting(company),
      position,
      form,
      percentage,
      location,
      deadline,
      status,
      contactPerson,
      notes,
      contact1,
      contact2,
      interview1,
      interview2,
      offer,
    };
  }

  return overview;
}

function findOverviewEntry(companyName, overviewMap) {
  const normalized = normalizeKey(companyName);
  if (overviewMap[normalized]) return overviewMap[normalized];

  const fallbackKey = Object.keys(overviewMap).find(
    (key) => key.includes(normalized) || normalized.includes(key)
  );

  return fallbackKey ? overviewMap[fallbackKey] : null;
}

function applyOverviewFields(application, overviewMap) {
  const match = findOverviewEntry(application.company, overviewMap);
  if (!match) {
    return application;
  }

  return {
    ...application,
    notes: match.notes || '',
    contact1: match.contact1 || '',
    contact2: match.contact2 || '',
    interview1: match.interview1 || '',
    interview2: match.interview2 || '',
    offer: match.offer || '',
    contactPerson: match.contactPerson || '',
    overviewStatus: match.status || '',
    deadline: application.deadline || match.deadline || '',
    location: application.location || match.location || ''
  };
}

async function copyAndIndexData() {
  try {
    const overviewMap = await parseOverview();

    // 1. Copy Files
    await fs.ensureDir(PUBLIC_DATA_DIR);
    const applicationsSource = path.join(SOURCE_DIR, '02_Søknader');
    
    if (await fs.pathExists(applicationsSource)) {
      console.log('Copying application data...');
      await fs.emptyDir(PUBLIC_DATA_DIR);
      await fs.copy(applicationsSource, path.join(PUBLIC_DATA_DIR, '02_Søknader'));
    } else {
      console.warn('Warning: Source directory not found:', applicationsSource);
      await fs.ensureDir(path.join(PUBLIC_DATA_DIR, '02_Søknader', 'Alle selskaper'));
      await fs.ensureDir(path.join(PUBLIC_DATA_DIR, '02_Søknader', 'Planlagte_Søknader'));
    }

    // 2. Generate Manifest
    console.log('Generating manifest...');
    const applications = [];
    
    // Scan "Alle selskaper"
    const companiesDir = path.join(PUBLIC_DATA_DIR, '02_Søknader', 'Alle selskaper');
    if (await fs.pathExists(companiesDir)) {
      const companies = await fs.readdir(companiesDir);
      
      for (const company of companies) {
        const companyPath = path.join(companiesDir, company);
        const stats = await fs.stat(companyPath);
        if (!stats.isDirectory()) continue;
        
        const files = await fs.readdir(companyPath);
        
        const hasCVPdf = files.some(f => f.includes('CV') && f.endsWith('.pdf'));
        const hasCoverPdf = files.some(f => (f.includes('Søknadsbrev') || f.includes('Cover Letter') || f.includes('Søknad')) && f.endsWith('.pdf'));
        
        let status = 'inProgress';
        if (hasCVPdf && hasCoverPdf) status = 'sent';
        
        // Process files for the manifest
        const fileInfos = [];
        let deadline = '';
        let location = '';
        let position = 'Ukjent stilling';
        let jobListingContent = '';
        
        for (const file of files) {
           const filePath = path.join(companyPath, file);
           if ((await fs.stat(filePath)).isDirectory()) continue;
           
           const publicUrl = `/data/02_Søknader/Alle selskaper/${encodeURIComponent(company)}/${encodeURIComponent(file)}`;
           
           if (file.endsWith('.md')) {
             const content = await fs.readFile(filePath, 'utf-8');
             fileInfos.push({ name: file, path: publicUrl, type: 'md', content });
             
             if (file.includes('Utlysning') || file.includes('Job Listing')) {
               jobListingContent = content;
               try {
                 const { content: markdown } = matter(content);
                 const lines = markdown.split('\n');
                 for (const line of lines) {
                   if (line.includes('Frist:')) deadline = line.split('Frist:')[1]?.trim().replace(/\*/g, '') || '';
                   if (line.includes('Sted:')) location = line.split('Sted:')[1]?.trim().replace(/\*/g, '') || '';
                 }
                 const headingMatch = markdown.match(/^#\s+(.+)/m);
                 if (headingMatch) position = headingMatch[1];
               } catch(e) {}
             }
           } else if (file.endsWith('.pdf')) {
             fileInfos.push({ name: file, path: publicUrl, type: 'pdf' });
           } else {
             fileInfos.push({ name: file, path: publicUrl, type: 'other' });
           }
        }
        
        let application = {
          company,
          position,
          status,
          deadline,
          location,
          files: fileInfos,
          jobListingContent,
          notes: '',
          contact1: '',
          contact2: '',
          interview1: '',
          interview2: '',
          offer: '',
          contactPerson: '',
          overviewStatus: ''
        };

        application = applyOverviewFields(application, overviewMap);
        applications.push(application);
      }
    }
    
    // Scan "Planlagte"
    const plannedDir = path.join(PUBLIC_DATA_DIR, '02_Søknader', 'Planlagte_Søknader');
    if (await fs.pathExists(plannedDir)) {
      const plannedFiles = (await fs.readdir(plannedDir)).filter(f => f.endsWith('.md') && f !== '.readme');
      
      for (const file of plannedFiles) {
        try {
          const content = await fs.readFile(path.join(plannedDir, file), 'utf-8');
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
          
          if (!applications.find(a => a.company === company)) {
            let application = {
              company,
              position,
              status: 'planned',
              deadline,
              location,
              files: [{ name: file, path: '#', type: 'md', content }],
              jobListingContent: content,
              notes: '',
              contact1: '',
              contact2: '',
              interview1: '',
              interview2: '',
              offer: '',
              contactPerson: '',
              overviewStatus: ''
            };

            application = applyOverviewFields(application, overviewMap);
            applications.push(application);
          }
        } catch (e) { console.error(e); }
      }
    }

    await fs.writeJson(MANIFEST_PATH, applications, { spaces: 2 });
    console.log(`Manifest written to ${MANIFEST_PATH}`);
    
  } catch (err) {
    console.error('Error copying data:', err);
    process.exit(1);
  }
}

copyAndIndexData();
