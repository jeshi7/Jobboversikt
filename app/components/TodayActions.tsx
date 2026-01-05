"use client";

import { Panel, Heading, BodyShort, Button } from "@navikt/ds-react";
import Link from "next/link";

interface Reminder {
  id: string;
  company: string;
  type: string;
  label: string;
  daysLeft?: number;
}

interface TodayActionsProps {
  reminders: Reminder[];
  intervjuReminders: Reminder[];
  plannedCount: number;
}

export function TodayActions({ reminders, intervjuReminders, plannedCount }: TodayActionsProps) {
  // Get the most urgent action
  const allReminders = [...reminders, ...intervjuReminders];
  const urgentReminder = allReminders
    .filter(r => r.daysLeft !== undefined && r.daysLeft <= 0)
    .sort((a, b) => (a.daysLeft || 0) - (b.daysLeft || 0))[0];
  
  const upcomingReminder = allReminders
    .filter(r => r.daysLeft !== undefined && r.daysLeft > 0)
    .sort((a, b) => (a.daysLeft || 0) - (b.daysLeft || 0))[0];

  const nextAction = urgentReminder || upcomingReminder;

  return (
    <Panel border className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <Heading level="2" size="small">
              Hva skal jeg gjøre i dag?
            </Heading>
          </div>
          
          {nextAction ? (
            <div className="space-y-2">
              <BodyShort size="small" className="text-slate-700">
                {urgentReminder ? (
                  <span className="text-red-600 font-medium">
                    ⚠️ {urgentReminder.company} trenger oppfølging nå!
                  </span>
                ) : (
                  <span>
                    Følg opp <strong>{nextAction.company}</strong> - {nextAction.label}
                  </span>
                )}
              </BodyShort>
              <div className="flex gap-2 mt-3">
                <Button size="small" variant="primary" as="a" href={`/applications`}>
                  Se oppfølging
                </Button>
              </div>
            </div>
          ) : plannedCount > 0 ? (
            <div className="space-y-2">
              <BodyShort size="small" className="text-slate-700">
                Du har <strong>{plannedCount} planlagte søknader</strong> som venter. 
                Kanskje tid for å sende en?
              </BodyShort>
              <div className="flex gap-2 mt-3">
                <Button size="small" variant="primary" as="a" href="/applications">
                  Se planlagte
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <BodyShort size="small" className="text-slate-700">
                Alt ser bra ut! Ingen presserende oppgaver akkurat nå. 🎉
              </BodyShort>
              <BodyShort size="small" className="text-slate-500 text-xs">
                Legg til en ny søknad for å holde momentum oppe.
              </BodyShort>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

