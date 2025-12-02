import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, MapPin, Download } from 'lucide-react';
import path from 'path';
import fs from 'fs';

interface FileInfo {
  name: string;
  path: string;
  type: 'pdf' | 'md' | 'image' | 'other';
  content?: string;
}

interface Application {
  company: string;
  position: string;
  location?: string;
  deadline?: string;
  jobListingContent?: string;
  files: FileInfo[];
}

// Function to get data (shared logic)
function getApplicationData(companyName: string): Application | null {
  try {
    const manifestPath = path.join(process.cwd(), 'app', 'data-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const data: Application[] = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const app = data.find(a => a.company === decodeURIComponent(companyName));
      return app || null;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

export default function ApplicationDetail({ params }: { params: { company: string } }) {
  const app = getApplicationData(params.company);

  if (!app) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Fant ikke selskap</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">Kunne ikke finne data for {decodeURIComponent(params.company)}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            Tilbake til oversikt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors">
      <div className="max-w-5xl mx-auto p-8">
        <Link href="/" className="inline-flex items-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbake til oversikt
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-4">
            {app.company}
          </h1>
          <h2 className="text-2xl text-neutral-600 dark:text-neutral-300 mb-6">
            {app.position}
          </h2>
          
          <div className="flex gap-6 text-sm text-neutral-500 dark:text-neutral-400">
            {app.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {app.location}
              </div>
            )}
            {app.deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {app.deadline}
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
                {app.jobListingContent || 'Ingen utlysningstekst funnet.'}
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
                {app.files && app.files.map((file, i) => (
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
