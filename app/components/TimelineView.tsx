"use client";

import type { Application } from "../../lib/applications";
import { Heading, BodyShort, Tag } from "@navikt/ds-react";
import { useState, useEffect } from "react";

interface TimelineEvent {
  type: "søknad" | "kontakt" | "intervju" | "resultat";
  date: string;
  label: string;
  note?: string;
}

interface TimelineViewProps {
  app: Application;
}

export function TimelineView({ app }: TimelineViewProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/timeline?company=${encodeURIComponent(app.company)}`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => {
        setEvents([]);
        setLoading(false);
      });
  }, [app.company]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "søknad":
        return "📧";
      case "kontakt":
        return "💬";
      case "intervju":
        return "🎯";
      case "resultat":
        return "✅";
      default:
        return "•";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "søknad":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "kontakt":
        return "bg-green-100 text-green-700 border-green-200";
      case "intervju":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "resultat":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("no-NO", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const calculateDaysBetween = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Heading level="3" size="xsmall">
          Tidslinje
        </Heading>
        <BodyShort size="small" className="text-slate-500">
          Laster...
        </BodyShort>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <Heading level="3" size="xsmall">
          Tidslinje
        </Heading>
        <BodyShort size="small" className="text-slate-500">
          Ingen hendelser registrert ennå.
        </BodyShort>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Heading level="3" size="xsmall">
        Tidslinje
      </Heading>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
        
        <div className="space-y-4">
          {events.map((event, index) => {
            const isLast = index === events.length - 1;
            const nextEvent = events[index + 1];
            const daysBetween = nextEvent
              ? calculateDaysBetween(event.date, nextEvent.date)
              : null;

            return (
              <div key={index} className="relative flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${getEventColor(
                    event.type
                  )} text-sm`}
                >
                  {getEventIcon(event.type)}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2">
                    <BodyShort size="small" className="font-medium text-slate-900">
                      {event.label}
                    </BodyShort>
                    {event.note && (
                      <Tag size="small" variant="neutral">
                        {event.note}
                      </Tag>
                    )}
                  </div>
                  <BodyShort size="small" className="text-slate-500 text-[11px]">
                    {formatDate(event.date)}
                  </BodyShort>
                  {daysBetween !== null && (
                    <BodyShort size="small" className="text-slate-400 text-[10px] mt-1">
                      {daysBetween === 1
                        ? "1 dag senere"
                        : `${daysBetween} dager senere`}
                    </BodyShort>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

