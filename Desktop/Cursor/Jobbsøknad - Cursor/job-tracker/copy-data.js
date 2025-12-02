const fs = require('fs-extra');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'Jobb_Søknad_Pakke');
const DEST_DIR = path.join(__dirname, 'public', 'data');

async function copyData() {
  try {
    // Ensure destination exists
    await fs.ensureDir(DEST_DIR);
    
    // Copy 02_Søknader specifically as that contains the companies
    const applicationsSource = path.join(SOURCE_DIR, '02_Søknader');
    
    if (await fs.pathExists(applicationsSource)) {
      console.log('Copying application data...');
      // Empty dir first to avoid stale data
      await fs.emptyDir(DEST_DIR);
      await fs.copy(applicationsSource, path.join(DEST_DIR, '02_Søknader'));
      console.log('Data copied successfully!');
    } else {
      console.warn('Warning: Source directory not found:', applicationsSource);
    }
  } catch (err) {
    console.error('Error copying data:', err);
    process.exit(1);
  }
}

copyData();

