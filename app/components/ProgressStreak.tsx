"use client";

import { useState, useEffect } from "react";
import { Panel, Heading, BodyShort } from "@navikt/ds-react";

interface ProgressStreakProps {
  sentCount: number;
  interviewCount: number;
}

const MILESTONES = [
  { count: 1, emoji: "🚀", message: "Første søknad sendt!" },
  { count: 5, emoji: "⭐", message: "5 søknader - du er i gang!" },
  { count: 10, emoji: "🔥", message: "10 søknader - imponerende innsats!" },
  { count: 15, emoji: "💪", message: "15 søknader - du gir ikke opp!" },
  { count: 20, emoji: "🏆", message: "20 søknader - mestermodus!" },
  { count: 25, emoji: "🌟", message: "25 søknader - du er en stjerne!" },
  { count: 30, emoji: "👑", message: "30 søknader - kongelig innsats!" },
];

export function ProgressStreak({ sentCount, interviewCount }: ProgressStreakProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [celebrationEmoji, setCelebrationEmoji] = useState("");

  // Find current milestone
  const currentMilestone = MILESTONES.filter(m => sentCount >= m.count).pop();
  const nextMilestone = MILESTONES.find(m => sentCount < m.count);
  
  // Calculate progress to next milestone
  const prevMilestoneCount = currentMilestone?.count || 0;
  const nextMilestoneCount = nextMilestone?.count || prevMilestoneCount + 5;
  const progressToNext = ((sentCount - prevMilestoneCount) / (nextMilestoneCount - prevMilestoneCount)) * 100;

  // Check for new milestone (stored in localStorage)
  useEffect(() => {
    const lastCelebrated = parseInt(localStorage.getItem("lastCelebratedMilestone") || "0", 10);
    
    if (currentMilestone && currentMilestone.count > lastCelebrated) {
      setCelebrationEmoji(currentMilestone.emoji);
      setCelebrationMessage(currentMilestone.message);
      setShowCelebration(true);
      localStorage.setItem("lastCelebratedMilestone", currentMilestone.count.toString());
      
      // Hide celebration after 5 seconds
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [sentCount, currentMilestone]);

  // Interview celebration
  useEffect(() => {
    const lastInterviewCelebrated = parseInt(localStorage.getItem("lastInterviewCelebration") || "0", 10);
    
    if (interviewCount > lastInterviewCelebrated && interviewCount > 0) {
      setCelebrationEmoji("🎉");
      setCelebrationMessage(`Du har ${interviewCount} intervju${interviewCount > 1 ? "er" : ""}! Lykke til!`);
      setShowCelebration(true);
      localStorage.setItem("lastInterviewCelebration", interviewCount.toString());
      
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [interviewCount]);

  return (
    <>
      {/* Celebration overlay */}
      {showCelebration && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setShowCelebration(false)}
        >
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-bounce-in max-w-sm mx-4">
            <div className="text-6xl mb-4">{celebrationEmoji}</div>
            <Heading level="2" size="medium" className="mb-2">
              Gratulerer!
            </Heading>
            <BodyShort size="small" className="text-slate-600">
              {celebrationMessage}
            </BodyShort>
            <BodyShort size="small" className="text-slate-400 mt-4 text-xs">
              Klikk for å lukke
            </BodyShort>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <Panel border className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentMilestone?.emoji || "🎯"}</span>
            <Heading level="3" size="xsmall">
              Din fremgang
            </Heading>
          </div>
          <BodyShort size="small" className="text-slate-600">
            {sentCount} søknad{sentCount !== 1 ? "er" : ""} sendt
          </BodyShort>
        </div>
        
        {nextMilestone && (
          <>
            <div className="h-2 w-full rounded-full bg-amber-200/50 mt-3">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
            <BodyShort size="small" className="text-slate-500 mt-2 text-xs">
              {nextMilestoneCount - sentCount} til neste milepæl: {nextMilestone.emoji} {nextMilestone.message}
            </BodyShort>
          </>
        )}
        
        {!nextMilestone && currentMilestone && (
          <BodyShort size="small" className="text-amber-700 mt-2">
            Du har nådd alle milepæler! {currentMilestone.emoji}
          </BodyShort>
        )}
      </Panel>
    </>
  );
}

