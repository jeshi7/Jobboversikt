'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Briefcase, Target, MessageSquare, Users } from 'lucide-react';

interface Resource {
  name: string;
  path: string;
  icon: string;
  description: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/resources')
      .then(res => res.json())
      .then(data => {
        setResources(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load resources:', err);
        setLoading(false);
      });
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'profile':
        return <Users className="w-6 h-6" />;
      case 'competence':
        return <Briefcase className="w-6 h-6" />;
      case 'projects':
        return <FileText className="w-6 h-6" />;
      case 'interview':
        return <MessageSquare className="w-6 h-6" />;
      case 'network':
        return <Target className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const openResource = (path: string) => {
    window.open(`file:///${path}`, '_blank');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Laster ressurser...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake
          </Link>
          <h1 className="text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
            Ressurser
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Rask tilgang til dine viktigste dokumenter og maler
          </p>
        </header>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.length > 0 ? (
            resources.map((resource, i) => (
              <button
                key={i}
                onClick={() => openResource(resource.path)}
                className="text-left p-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                    {getIcon(resource.icon)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                      {resource.name}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {resource.description}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-neutral-500 dark:text-neutral-400">
                Ingen ressurser funnet
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

