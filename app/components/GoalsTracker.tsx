"use client";

import { useState, useEffect } from "react";
import { Heading, BodyShort, Panel, Button, Progress } from "@navikt/ds-react";

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  period: "month" | "week";
}

interface GoalsTrackerProps {
  currentCount: number;
  sentCount: number;
}

export function GoalsTracker({ currentCount, sentCount }: GoalsTrackerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    // Load goals from localStorage
    const stored = localStorage.getItem("job-application-goals");
    if (stored) {
      try {
        setGoals(JSON.parse(stored));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem("job-application-goals", JSON.stringify(newGoals));
  };

  const addGoal = () => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: "Sendt søknader",
      target: 5,
      current: sentCount,
      period: "month"
    };
    saveGoals([...goals, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    const updated = goals.map((g) => 
      g.id === id ? { ...g, ...updates, current: g.title === "Sendt søknader" ? sentCount : g.current } : g
    );
    saveGoals(updated);
  };

  const deleteGoal = (id: string) => {
    saveGoals(goals.filter((g) => g.id !== id));
  };

  return (
    <Panel border>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Heading level="2" size="small">
            Dine mål
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            Sett og følg opp dine søknadsmål
          </BodyShort>
        </div>
        <Button size="xsmall" variant="secondary" onClick={addGoal}>
          + Nytt mål
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <BodyShort size="small" className="text-slate-500 mb-3">
            Ingen mål satt ennå
          </BodyShort>
          <Button size="small" variant="secondary" onClick={addGoal}>
            Sett første mål
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <BodyShort size="small" className="font-medium text-slate-900">
                      {goal.title}
                    </BodyShort>
                    <BodyShort size="small" className="text-slate-500 text-[11px]">
                      {goal.current} av {goal.target} {goal.period === "month" ? "denne måneden" : "denne uken"}
                    </BodyShort>
                  </div>
                  <Button
                    size="xsmall"
                    variant="tertiary"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    Slett
                  </Button>
                </div>
                <Progress value={progress} />
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}







