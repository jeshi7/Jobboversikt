import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, MapPin, Download, FolderOpen, ExternalLink } from 'lucide-react';
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
  const files = app?.files ?? [];

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

  const defaultActionFile = files[0];
  const folderHref = defaultActionFile
    ? defaultActionFile.path.split('/').slice(0, -1).join('/')
    : undefined;

  const cvFiles = files.filter((file) => /cv/i.test(file.name));
  const coverFiles = files.filter((file) =>
    /(søknadsbrev|cover|søknad)/i.test(file.name)
  );
  const otherFiles = files.filter(
    (file) => !cvFiles.includes(file) && !coverFiles.includes(file)
  );

  const followUpFields = [
    { label: 'Notater', value: app.notes },
    { label: 'Kontakt 1', value: app.contact1 },
    { label: 'Kontakt 2', value: app.contact2 },
    { label: 'Intervju 1', value: app.interview1 },
    { label: 'Intervju 2', value: app.interview2 },
    { label: 'Tilbud', value: app.offer },
  ];

  const renderFileButton = (
    file: FileInfo,
    accent: 'blue' | 'green' | 'neutral' = 'neutral'
  ) => {
    const accentClasses =
      accent === 'blue'
        ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30'
        : accent === 'green'
        ? 'text-green-500 bg-green-50 dark:bg-green-900/30'
        : 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800/60';

    return (
      <a
        key={file.name}
        href={file.path}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-2 p-2 text-sm text-left bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
      >
        <div className={`p-2 rounded ${accentClasses}`}>
          {file.type === 'pdf' ? (
            <FileText className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </div>
        <span className="truncate">{file.name}</span>
        <ExternalLink className="w-3 h-3 ml-auto text-neutral-400" />
      </a>
    );
  };

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
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-2">
                Handlinger
              </h3>
              <a
                href={folderHref || defaultActionFile?.path || '#'}
                target={folderHref || defaultActionFile ? '_blank' : undefined}
                rel={folderHref || defaultActionFile ? 'noopener noreferrer' : undefined}
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

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-2">
                Filer
              </h3>
              {cvFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-500">CV</p>
                  {cvFiles.map((file) => renderFileButton(file, 'blue'))}
                </div>
              )}
              {coverFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-500">Søknadsbrev</p>
                  {coverFiles.map((file) => renderFileButton(file, 'green'))}
                </div>
              )}
              {otherFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-500">Andre filer</p>
                  {otherFiles.map((file) => renderFileButton(file))}
                </div>
              )}
              {!files.length && (
                <p className="text-sm text-neutral-500">Ingen filer funnet.</p>
              )}
            </div>

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
