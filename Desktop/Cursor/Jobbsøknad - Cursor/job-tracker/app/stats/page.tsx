'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Clock, CheckCircle, Calendar } from 'lucide-react';

interface Application {
  company: string;
  position: string;
  status: 'planned' | 'inProgress' | 'sent';
  deadline?: string;
  location?: string;
}

export default function StatsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
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

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Laster statistikk...</div>
      </main>
    );
  }

  const planned = applications.filter(a => a.status === 'planned');
  const inProgress = applications.filter(a => a.status === 'inProgress');
  const sent = applications.filter(a => a.status === 'sent');

  const completionRate = applications.length > 0 
    ? Math.round((sent.length / applications.length) * 100) 
    : 0;

  // Group by location
  const locationStats = applications.reduce((acc, app) => {
    if (app.location) {
      acc[app.location] = (acc[app.location] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topLocations = Object.entries(locationStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Upcoming deadlines
  const upcomingDeadlines = applications
    .filter(a => a.deadline && a.status !== 'sent')
    .sort((a, b) => {
      if (!a.deadline || !b.deadline) return 0;
      return a.deadline.localeCompare(b.deadline);
    })
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake
          </Link>
          <h1 className="text-4xl font-light text-neutral-900 dark:text-neutral-100">
            Statistikk
          </h1>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Totalt
              </h3>
            </div>
            <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
              {applications.length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Sendt
              </h3>
            </div>
            <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
              {sent.length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Under arbeid
              </h3>
            </div>
            <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
              {inProgress.length}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Fullføringsgrad
              </h3>
            </div>
            <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
              {completionRate}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
              Status fordeling
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Sendt</span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {sent.length}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 rounded-full transition-all"
                    style={{ width: `${(sent.length / applications.length) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Under arbeid</span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {inProgress.length}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all"
                    style={{ width: `${(inProgress.length / applications.length) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Planlagt</span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {planned.length}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${(planned.length / applications.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
              Populære steder
            </h2>
            <div className="space-y-4">
              {topLocations.length > 0 ? (
                topLocations.map(([location, count]) => (
                  <div key={location}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {location}
                      </span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all"
                        style={{ width: `${(count / applications.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-400 text-center py-4">
                  Ingen lokasjon data tilgjengelig
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 md:col-span-2">
            <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
              Kommende frister
            </h2>
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((app, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-md"
                  >
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {app.company}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {app.position}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {app.deadline}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {app.status === 'planned' ? 'Planlagt' : 'Under arbeid'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 text-center py-8">
                Ingen kommende frister
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

