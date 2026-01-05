"use client";

import { useEffect, useState } from "react";
import { Panel, Heading, BodyShort } from "@navikt/ds-react";

interface ActivityDay {
  date: string;
  count: number;
}

export function ActivityHeatmap() {
  const [activity, setActivity] = useState<ActivityDay[]>([]);

  useEffect(() => {
    // Fetch activity data from API
    fetch("/api/activity")
      .then((res) => res.json())
      .then((data) => {
        setActivity(data.days || []);
      })
      .catch(() => {
        setActivity([]);
      });
  }, []);

  const getIntensityColor = (count: number) => {
    if (count === 0) return "bg-slate-100";
    if (count === 1) return "bg-green-200";
    if (count === 2) return "bg-green-400";
    if (count >= 3) return "bg-green-600";
  };

  const formatMonthLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("no-NO", { month: "short" });
  };

  // Group by weeks for better visualization
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < activity.length; i += 7) {
    weeks.push(activity.slice(i, i + 7));
  }

  return (
    <Panel border>
      <div className="mb-4">
        <Heading level="2" size="small">
          Aktivitetsoversikt
        </Heading>
        <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
          Søknadsaktivitet over det siste året
        </BodyShort>
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${day.date}-${dayIndex}`}
                  className={`h-3 w-3 rounded-sm ${getIntensityColor(day.count)}`}
                  title={`${new Date(day.date).toLocaleDateString("no-NO")}: ${day.count} søknad${day.count !== 1 ? "er" : ""}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Mindre</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-sm bg-slate-100" />
            <div className="h-3 w-3 rounded-sm bg-green-200" />
            <div className="h-3 w-3 rounded-sm bg-green-400" />
            <div className="h-3 w-3 rounded-sm bg-green-600" />
          </div>
          <span>Mer</span>
        </div>
      </div>
    </Panel>
  );
}

