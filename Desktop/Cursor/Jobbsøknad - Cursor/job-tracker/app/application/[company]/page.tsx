import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, MapPin, Download } from 'lucide-react';

interface FileInfo {
  name: string;
  path: string;
  type: 'pdf' | 'md' | 'image' | 'other';
  content?: string;
}

export default function ApplicationDetail({ params }: { params: { company: string } }) {
  const companyName = decodeURIComponent(params.company);
  
  // Determine source directory (priority: public/data for prod, local for dev fallback)
  const dataDir = path.join(process.cwd(), 'public', 'data', '02_Søknader', 'Alle selskaper');
  const localSource = path.join(process.cwd(), '..', 'Jobb_Søknad_Pakke', '02_Søknader', 'Alle selskaper');
  
  let companyDir = '';
  let isPublicData = false;

  if (fs.existsSync(path.join(dataDir, companyName))) {
    companyDir = path.join(dataDir, companyName);
    isPublicData = true;
  } else if (fs.existsSync(path.join(localSource, companyName))) {
    companyDir = path.join(localSource, companyName);
  }

  if (!companyDir) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Fant ikke selskap</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">Kunne ikke finne mappen for {companyName}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            Tilbake til oversikt
          </Link>
        </div>
      </div>
    );
  }

  const files = fs.readdirSync(companyDir);
  const fileInfos: FileInfo[] = [];
  
  let jobListingContent = '';
  let metadata = {
    position: 'Ukjent stilling',
    deadline: '',
    location: ''
  };

  files.forEach(file => {
    const filePath = path.join(companyDir, file);
    if (fs.statSync(filePath).isDirectory()) return;

    // Build public URL if using public data, otherwise file URL (which won't work remotely but fine for local fallback)
    // Actually, if we are in localSource mode (dev without copy), we can't serve files easily via URL unless we setup a route.
    // But for the purpose of the Vercel deploy, we assume isPublicData will be true.
    // If locally, we might want to just show names.
    
    // Construct URL relative to public
    const publicUrl = isPublicData 
      ? `/data/02_Søknader/Alle selskaper/${encodeURIComponent(companyName)}/${encodeURIComponent(file)}`
      : `file://${filePath}`; // Fallback for pure local dev without copy

    if (file.endsWith('.md')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (file.includes('Utlysning') || file.includes('Job Listing')) {
        const { content: markdown, data } = matter(content);
        jobListingContent = markdown;
        
        // Parse metadata manually from text if not in frontmatter
        const lines = markdown.split('\n');
        for (const line of lines) {
          if (line.includes('Frist:')) metadata.deadline = line.split('Frist:')[1]?.trim().replace(/\*/g, '') || '';
          if (line.includes('Sted:')) metadata.location = line.split('Sted:')[1]?.trim().replace(/\*/g, '') || '';
        }
        const headingMatch = markdown.match(/^#\s+(.+)/m);
        if (headingMatch) metadata.position = headingMatch[1];
      }
      
      fileInfos.push({
        name: file,
        path: publicUrl,
        type: 'md',
        content
      });
    } else if (file.endsWith('.pdf')) {
      fileInfos.push({
        name: file,
        path: publicUrl,
        type: 'pdf'
      });
    } else {
      fileInfos.push({
        name: file,
        path: publicUrl,
        type: 'other'
      });
    }
  });

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors">
      <div className="max-w-5xl mx-auto p-8">
        <Link href="/" className="inline-flex items-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbake til oversikt
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-4">
            {companyName}
          </h1>
          <h2 className="text-2xl text-neutral-600 dark:text-neutral-300 mb-6">
            {metadata.position}
          </h2>
          
          <div className="flex gap-6 text-sm text-neutral-500 dark:text-neutral-400">
            {metadata.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {metadata.location}
              </div>
            )}
            {metadata.deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {metadata.deadline}
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Job Listing or Notes) */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white dark:bg-neutral-800 rounded-xl p-8 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FileText className="w-5 h-5" />
                Utlysning / Notater
              </h3>
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                {jobListingContent || 'Ingen utlysningstekst funnet.'}
              </div>
            </section>
          </div>

          {/* Sidebar (Files) */}
          <div className="space-y-6">
            <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-medium mb-4 text-neutral-900 dark:text-neutral-100">
                Dokumenter
              </h3>
              <div className="space-y-3">
                {fileInfos.map((file, i) => (
                  <a
                    key={i}
                    href={file.path}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-600 transition-all group"
                  >
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md mr-3 text-blue-600 dark:text-blue-400">
                      {file.type === 'pdf' ? <FileText className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {file.type.toUpperCase()}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

