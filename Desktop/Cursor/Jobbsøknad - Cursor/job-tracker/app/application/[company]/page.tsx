import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, MapPin, Download, FolderOpen } from 'lucide-react';
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
  notes?: string;
  contact1?: string;
  contact2?: string;
  interview1?: string;
  interview2?: string;
  offer?: string;
  contactPerson?: string;
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

  const files = app.files || [];
  const defaultActionFile = files[0];
  const followUpFields = [
    { label: 'Notater', value: app.notes },
    { label: 'Kontakt 1', value: app.contact1 },
    { label: 'Kontakt 2', value: app.contact2 },
    { label: 'Intervju 1', value: app.interview1 },
    { label: 'Intervju 2', value: app.interview2 },
    { label: 'Tilbud', value: app.offer },
  ];

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
          
          <div className="flex flex-wrap gap-6 text-sm text-neutral-500 dark:text-neutral-400">
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
          {app.contactPerson && (
            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              Kontaktperson:{' '}
              <span className="text-neutral-900 dark:text-neutral-100">{app.contactPerson}</span>
            </p>
          )}
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

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                Handlinger
              </h3>
              <a
                href={defaultActionFile ? defaultActionFile.path : undefined}
                target={defaultActionFile ? '_blank' : undefined}
                rel={defaultActionFile ? 'noopener noreferrer' : undefined}
                aria-disabled={!defaultActionFile}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  defaultActionFile
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                Åpne mappe
              </a>
            </div>

            <section className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                Filer
              </h3>
              <div className="space-y-3">
                {files.map((file, i) => (
                  <a
                    key={`${file.name}-${i}`}
                    href={file.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md mr-3 text-blue-600 dark:text-blue-400">
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-neutral-400"
                    >
                      <path d="M15 3h6v6"></path>
                      <path d="M10 14 21 3"></path>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    </svg>
                  </a>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-4">
                Oppfølging
              </h3>
              <div className="space-y-4">
                {followUpFields.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">
                      {value && value !== '-' ? value : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
