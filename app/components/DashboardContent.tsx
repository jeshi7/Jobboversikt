"use client";

import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { Heading, BodyShort, Panel, Button } from "@navikt/ds-react";
import { PipelineBoard } from "./PipelineBoard";
import { ContactReminders } from "./ContactReminders";
import { DreamList } from "./DreamList";
import { GoalsTracker } from "./GoalsTracker";
import { MotivationQuote } from "./MotivationQuote";
import { TodayActions } from "./TodayActions";
import { ProgressStreak } from "./ProgressStreak";
import type { Application } from "../../lib/applications";

interface DashboardContentProps {
  apps: Application[];
  summary: { total: number; sent: number; interview: number; planned: number };
  sentApps: Application[];
  interviewApps: Application[];
  plannedApps: Application[];
  avslåttApps: Application[];
  contactReminders: any[];
  intervjuReminders: any[];
  dreamCompanies: any[];
  groupedDreams: any;
}

export function DashboardContent({
  apps,
  summary,
  sentApps,
  interviewApps,
  plannedApps,
  avslåttApps,
  contactReminders,
  intervjuReminders,
  dreamCompanies,
  groupedDreams
}: DashboardContentProps) {
  const { user } = useCurrentUser();

  const getTitle = () => {
    if (user?.role === "admin" || user?.role === "consultant") {
      return "Oversikt over alle klienters søknader";
    }
    return "En rolig oversikt over alle søknadene dine";
  };

  const getDescription = () => {
    if (user?.role === "admin" || user?.role === "consultant") {
      return "Se hvor klientene er i prosessen, hva som er sendt, og hvilke muligheter som ligger foran dem.";
    }
    return "Se hvor du er i prosessen, hva som er sendt, og hvilke muligheter som ligger foran deg.";
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <BodyShort
            size="small"
            className="text-xs uppercase tracking-[0.25em] text-slate-500"
          >
            {user?.role === "admin" || user?.role === "consultant" ? "Klientoversikt" : "Din jobbreise"}
          </BodyShort>
          <Heading level="1" size="large" className="mt-2">
            {getTitle()}
          </Heading>
          <BodyShort size="small" className="mt-2 max-w-xl text-slate-600">
            {getDescription()}
          </BodyShort>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            as="a"
            href="/applications?action=new"
            size="small"
            variant="primary"
          >
            + Ny søknad
          </Button>
          <Button
            as="a"
            href="/applications"
            size="small"
            variant="secondary"
          >
            Åpne søknader
          </Button>
          <Button as="a" href="/resources" size="small" variant="tertiary">
            Se ressurser
          </Button>
        </div>
      </section>

      {/* Today's actions - only for clients */}
      {user?.role === "client" && (
        <TodayActions 
          reminders={contactReminders} 
          intervjuReminders={intervjuReminders}
          plannedCount={summary.planned}
        />
      )}

      {/* Stats panels */}
      <section className="grid gap-4 md:grid-cols-4">
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Totalt
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {summary.total}
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            registrerte selskaper i systemet
          </BodyShort>
        </Panel>
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Sendte søknader
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {summary.sent}
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            med tilpasset CV og søknadsbrev
          </BodyShort>
        </Panel>
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Intervjuer
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {summary.interview}
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            pågående prosesser
          </BodyShort>
        </Panel>
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Planlagt
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {summary.planned}
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            ideer og muligheter
          </BodyShort>
        </Panel>
      </section>

      {/* Pipeline and Reminders */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PipelineBoard
            planned={plannedApps}
            sent={sentApps}
            interview={interviewApps}
            avslått={avslåttApps}
          />
        </div>

        <div className="space-y-6">
          {/* Progress streak for clients */}
          {user?.role === "client" && (
            <ProgressStreak sentCount={summary.sent} interviewCount={summary.interview} />
          )}

          <Panel border className="space-y-4">
            <div>
              <Heading level="2" size="small">
                Oppfølging
              </Heading>
              <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
                Selskaper som trenger en oppfølging eller forberedelse.
              </BodyShort>
            </div>
            <ContactReminders reminders={contactReminders} intervjuReminders={intervjuReminders} />
          </Panel>

          <GoalsTracker currentCount={summary.total} sentCount={summary.sent} />
          <MotivationQuote />
        </div>
      </section>

      {/* Dream list - only show for clients */}
      {user?.role === "client" && (
        <section>
          <Panel border>
            <div className="mb-4">
              <Heading level="2" size="small">
                Drømmelista
              </Heading>
              <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
                Selskaper du drømmer om å jobbe hos. Klikk på et selskap for å se
                din vinkel og tips.
              </BodyShort>
            </div>
            <DreamList companies={dreamCompanies} grouped={groupedDreams} />
          </Panel>
        </section>
      )}
    </div>
  );
}







