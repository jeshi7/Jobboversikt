"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// Store for keyboard help modal state
let showHelpCallback: (() => void) | null = null;

export function setShowHelpCallback(callback: () => void) {
  showHelpCallback = callback;
}

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // ? to show keyboard shortcuts help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (showHelpCallback) {
          showHelpCallback();
        }
      }

      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Søk"], input[placeholder*="søk"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // g then letter for go-to navigation
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Wait for next key
        const handleNextKey = (e2: KeyboardEvent) => {
          window.removeEventListener("keydown", handleNextKey);
          const goToRoutes: Record<string, string> = {
            o: "/", // go to overview
            s: "/applications", // go to søknader
            r: "/resources", // go to ressurser
            k: "/kompetanse", // go to kompetanse
            t: "/tips", // go to tips
            a: "/admin", // go to admin
          };
          if (goToRoutes[e2.key]) {
            router.push(goToRoutes[e2.key]);
          }
        };
        window.addEventListener("keydown", handleNextKey, { once: true });
        // Remove listener after 1 second if no key pressed
        setTimeout(() => window.removeEventListener("keydown", handleNextKey), 1000);
      }

      // Number keys for navigation (1-6)
      if (e.key >= "1" && e.key <= "6" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const routes = [
          "/", // 1
          "/applications", // 2
          "/resources", // 3
          "/kompetanse", // 4
          "/tips", // 5
          "/stats", // 6
        ];
        const index = parseInt(e.key) - 1;
        if (routes[index]) {
          router.push(routes[index]);
        }
      }

      // Escape to close modals/popups
      if (e.key === "Escape") {
        const modals = document.querySelectorAll('[role="dialog"], .fixed.inset-0');
        if (modals.length > 0) {
          const lastModal = modals[modals.length - 1] as HTMLElement;
          const closeButton = lastModal.querySelector('button[aria-label*="Lukk"], button:has-text("Lukk")');
          if (closeButton) {
            (closeButton as HTMLButtonElement).click();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}

// Keyboard shortcuts help component
export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setShowHelpCallback(() => setIsOpen(true));
    return () => { showHelpCallback = null; };
  }, []);

  if (!isOpen) return null;

  const shortcuts = [
    { keys: ["?"], description: "Vis denne hjelpen" },
    { keys: ["1-6"], description: "Naviger til side (1=Oversikt, 2=Søknader, osv.)" },
    { keys: ["g", "o"], description: "Gå til Oversikt" },
    { keys: ["g", "s"], description: "Gå til Søknader" },
    { keys: ["g", "r"], description: "Gå til Ressurser" },
    { keys: ["g", "k"], description: "Gå til Kompetanse" },
    { keys: ["g", "t"], description: "Gå til Tips" },
    { keys: ["g", "a"], description: "Gå til Admin" },
    { keys: ["Ctrl/⌘", "K"], description: "Fokuser søkefelt" },
    { keys: ["Esc"], description: "Lukk modal/dialog" },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Hurtigtaster</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-2">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-600">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <span key={j}>
                    <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 rounded border border-slate-200">
                      {key}
                    </kbd>
                    {j < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-slate-400">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <p className="mt-4 text-xs text-slate-400 text-center">
          Trykk Esc eller klikk utenfor for å lukke
        </p>
      </div>
    </div>
  );
}







