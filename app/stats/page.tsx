import { loadApplications, summariseApplications } from "../../lib/applications";
import { loadOverviewRows } from "../../lib/overview";
import { StatsContent } from "../components/StatsContent";
import { getCurrentUserServer } from "../../lib/get-current-user-server";
import { getClientsByOrganization } from "../../lib/db";

export default async function StatsPage({
  searchParams
}: {
  searchParams?: { clientId?: string };
}) {
  const user = await getCurrentUserServer();
  
  // Get clientId for filtering
  let clientId: string | undefined;
  
  if (user?.role === "client" && user?.email) {
    // Client sees only their own statistics
    const clients = getClientsByOrganization(user.organizationId);
    const client = clients.find(c => c.email === user.email);
    clientId = client?.id;
  } else if ((user?.role === "consultant" || user?.role === "admin") && searchParams?.clientId) {
    // Consultant/Admin can filter by selected client
    clientId = searchParams.clientId;
  }
  
  const apps = loadApplications({
    userRole: user?.role,
    userOrganizationId: user?.organizationId,
    userId: user?.id,
    selectedClientId: clientId || undefined
  });
  const summary = summariseApplications(apps);
  const overviewRows = loadOverviewRows();

  // Calculate success rate
  const successRate = (() => {
    const withResponse = apps.filter(
      (a) => a.status === "intervju" || a.status === "ansatt" || a.status === "avslått"
    ).length;
    const sent = apps.filter((a) => a.status === "sendt" || a.status === "forberedes" || a.status === "intervju" || a.status === "ansatt" || a.status === "avslått").length;
    
    if (sent === 0) return 0;
    return Math.round((withResponse / sent) * 100);
  })();

  // Calculate average time to response
  const avgResponseTime = (() => {
    const rowsWithInterviews = overviewRows.filter(
      (r) => r.sentDate && (r.intervju1 || r.status.includes("Avslått") || r.status.includes("Ansatt"))
    );

    if (rowsWithInterviews.length === 0) return null;

    const times: number[] = [];

    rowsWithInterviews.forEach((row) => {
      if (!row.sentDate) return;

      const sentDate = parseDate(row.sentDate);
      if (!sentDate) return;

      // Find first response (interview or rejection/acceptance)
      let responseDate: Date | null = null;

      if (row.intervju1) {
        responseDate = parseDate(row.intervju1);
      } else if (row.status.includes("Avslått") || row.status.includes("Ansatt")) {
        // Approximate based on when status was set
        responseDate = new Date(); // This is approximate
      }

      if (responseDate) {
        const diffTime = Math.abs(responseDate.getTime() - sentDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays < 365) {
          // Sanity check
          times.push(diffDays);
        }
      }
    });

    if (times.length === 0) return null;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return Math.round(avg);
  })();

  function parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.trim() === "" || dateStr === "-" || dateStr === "–") {
      return null;
    }
    const parts = dateStr.trim().split(/[.\-]/);
    if (parts.length >= 2) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
      const fullYear = year < 100 ? 2000 + year : year;
      const date = new Date(fullYear, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return null;
  }

  return (
    <StatsContent
      apps={apps}
      summary={summary}
      overviewRows={overviewRows}
      successRate={successRate}
      avgResponseTime={avgResponseTime}
    />
  );
}
