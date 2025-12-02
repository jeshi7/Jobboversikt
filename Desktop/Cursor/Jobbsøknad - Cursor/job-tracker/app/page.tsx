'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Moon, Sun, BarChart3, FileText } from 'lucide-react';

interface ApplicationFile {
  name: string;
  path: string;
  type: 'pdf' | 'md' | 'other';
  content?: string;
}

interface Application {
  company: string;
  position: string;
  status: 'planned' | 'inProgress' | 'sent';
  deadline?: string;
  location?: string;
  folderPath?: string;
  notes?: string;
  contact1?: string;
  contact2?: string;
  interview1?: string;
  interview2?: string;
  offer?: string;
  contactPerson?: string;
  files?: ApplicationFile[];
  jobListingContent?: string;
}

export default function Home() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications')
      .then(res => res.json())
      .then(data => {
        setApplications(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load applications:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const filteredApplications = applications.filter(app =>
    app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const planned = filteredApplications.filter(a => a.status === 'planned');
  const inProgress = filteredApplications.filter(a => a.status === 'inProgress');
  const sent = filteredApplications.filter(a => a.status === 'sent');

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Laster søknader...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-light text-neutral-900 dark:text-neutral-100">
              Søknadsoversikt
            </h1>
            <div className="flex items-center gap-3">
              <Link
                href="/stats"
                className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                title="Statistikk"
              >
                <BarChart3 className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </Link>
              <Link
                href="/resources"
                className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                title="Ressurser"
              >
                <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </Link>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                title={darkMode ? 'Lys modus' : 'Mørk modus'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-neutral-400" />
                ) : (
                  <Moon className="w-5 h-5 text-neutral-600" />
                )}
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neutral-400" />
              <span className="text-neutral-600 dark:text-neutral-400">
                {applications.length} totalt
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-neutral-600 dark:text-neutral-400">
                {sent.length} sendt
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-neutral-600 dark:text-neutral-400">
                {inProgress.length} under arbeid
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-neutral-600 dark:text-neutral-400">
                {planned.length} planlagt
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Søk etter bedrift, stilling eller sted..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
          </div>
        </header>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Planned Column */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                Planlagt
              </h2>
              <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
                {planned.length}
              </span>
            </div>
            <div className="space-y-3">
              {planned.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">
                  Ingen planlagte søknader
                </p>
              ) : (
                planned.map((app, i) => (
                  <ApplicationCard key={i} app={app} />
                ))
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                Under arbeid
              </h2>
              <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
                {inProgress.length}
              </span>
            </div>
            <div className="space-y-3">
              {inProgress.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">
                  Ingen pågående søknader
                </p>
              ) : (
                inProgress.map((app, i) => (
                  <ApplicationCard key={i} app={app} />
                ))
              )}
            </div>
          </div>

          {/* Sent Column */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                Sendt
              </h2>
              <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
                {sent.length}
              </span>
            </div>
            <div className="space-y-3">
              {sent.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">
                  Ingen sendte søknader
                </p>
              ) : (
                sent.map((app, i) => (
                  <ApplicationCard key={i} app={app} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* No Results */}
        {searchQuery && filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">
              Ingen resultater for "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function ApplicationCard({ app }: { app: Application }) {
  const router = useRouter();

  const handleClick = () => {
    if (app.company) {
      router.push(`/application/${encodeURIComponent(app.company)}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-md border border-neutral-100 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors cursor-pointer"
    >
      <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
        {app.company}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
        {app.position}
      </p>
      {(app.location || app.deadline) && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
          {app.location && <div>📍 {app.location}</div>}
          {app.deadline && <div>📅 {app.deadline}</div>}
        </div>
      )}
    </button>
  );
}
