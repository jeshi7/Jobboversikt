"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
        // This would close any open modals - implement based on your modal system
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







