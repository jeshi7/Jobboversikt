"use client";

import { ClientSwitcher } from "./ClientSwitcher";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Wrapper component that syncs client selection with URL search params
 * This allows server components to read the selected client
 */
export function ClientSwitcherWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ClientSwitcher />;
  }

  const handleClientChange = (clientId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (clientId) {
      params.set("clientId", clientId);
    } else {
      params.delete("clientId");
    }
    router.push(`?${params.toString()}`);
    router.refresh();
  };

  return <ClientSwitcher onClientChange={handleClientChange} />;
}







