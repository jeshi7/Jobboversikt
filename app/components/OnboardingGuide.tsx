"use client";

import { useState, useEffect } from "react";
import { Panel, Heading, BodyShort, Button } from "@navikt/ds-react";

interface Step {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Velkommen til Jobboversikt!",
    description: "Her holder du styr på alle jobbsøknadene dine. La oss ta en rask gjennomgang.",
    emoji: "👋"
  },
  {
    id: "pipeline",
    title: "Søknadspipeline",
    description: "Se alle søknadene dine organisert etter status: planlagt, sendt, intervju, eller avslag.",
    emoji: "📊"
  },
  {
    id: "reminders",
    title: "Oppfølging",
    description: "Vi minner deg på når det er tid for å følge opp en søknad eller forberede deg til intervju.",
    emoji: "⏰"
  },
  {
    id: "goals",
    title: "Sett deg mål",
    description: "Hold motivasjonen oppe ved å sette ukentlige eller månedlige søknadsmål.",
    emoji: "🎯"
  },
  {
    id: "shortcuts",
    title: "Hurtigtaster",
    description: "Trykk ? hvor som helst for å se alle hurtigtaster. Naviger raskt med g+o (oversikt), g+s (søknader), osv.",
    emoji: "⌨️"
  }
];

export function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("hasSeenOnboarding");
    if (!seen) {
      setHasSeenOnboarding(false);
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasSeenOnboarding", "true");
    setHasSeenOnboarding(true);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  if (!isOpen) {
    // Show small help button
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-white shadow-lg hover:bg-slate-700 transition-colors"
        title="Vis guide"
      >
        <span>?</span>
        <span className="text-sm hidden sm:inline">Hjelp</span>
      </button>
    );
  }

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
      <Panel border className="max-w-md w-full animate-bounce-in">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{step.emoji}</div>
          <Heading level="2" size="medium">
            {step.title}
          </Heading>
          <BodyShort size="small" className="mt-2 text-slate-600">
            {step.description}
          </BodyShort>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep ? "bg-accent" : "bg-slate-300"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            size="small"
            variant="tertiary"
            onClick={currentStep === 0 ? handleClose : handlePrev}
          >
            {currentStep === 0 ? "Hopp over" : "Forrige"}
          </Button>
          <Button size="small" variant="primary" onClick={handleNext}>
            {currentStep === STEPS.length - 1 ? "Kom i gang!" : "Neste"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}

