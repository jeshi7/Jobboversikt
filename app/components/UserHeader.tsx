"use client";

import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { Button } from "@navikt/ds-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function UserHeader() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  const handleLogout = async () => {
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
    }
    localStorage.removeItem("sessionId");
    localStorage.removeItem("user");
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center">
        <span className="text-sm text-slate-400">Laster...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button size="small" variant="primary">
          Logg inn
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:inline text-sm text-slate-700">
        {user.name}
      </span>
      <span className="hidden md:inline text-xs text-slate-400 uppercase tracking-wide">
        {user.role}
      </span>
      <Button size="small" variant="tertiary" onClick={handleLogout}>
        Logg ut
      </Button>
    </div>
  );
}

