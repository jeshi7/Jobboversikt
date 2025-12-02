const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');

const SOURCE_DIR = path.join(__dirname, '..', 'Jobb_Søknad_Pakke');
const PUBLIC_DATA_DIR = path.join(__dirname, 'public', 'data');
const MANIFEST_PATH = path.join(__dirname, 'app', 'data-manifest.json');

async function copyAndIndexData() {
  try {
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
        
        applications.push({
          company,
          position,
          status,
          deadline,
          location,
          files: fileInfos,
          jobListingContent
        });
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
            applications.push({
              company,
              position,
              status: 'planned',
              deadline,
              location,
              files: [{ name: file, path: '#', type: 'md', content }],
              jobListingContent: content
            });
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
