import { DashboardContent } from "./components/DashboardContent";
import { getCurrentUserServer } from "../lib/get-current-user-server";
import { listApplications, Application as SupabaseApp } from "../lib/supabase-db";

// Force dynamic rendering to always get fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Map Supabase application to expected format
interface DashboardApp {
  id: string;
  slug: string;
  company: string;
  jobTitle: string;
  status: string;
  type: string;
  deadline?: string;
  location?: string;
  employmentType?: string;
  angle?: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  sentAt?: string;
  interviewDates?: string[];
  kontakt1?: string;
  kontakt2?: string;
  intervju1?: string;
  cvText?: string;
  coverLetterText?: string;
  folder: string;
  resources: string[];
}

function mapSupabaseApp(app: SupabaseApp): DashboardApp {
  return {
    id: app.id,
    slug: app.company.toLowerCase().replace(/\s+/g, "-"),
    company: app.company,
    jobTitle: app.job_title,
    status: app.status,
    type: ["planlagt", "forberedes"].includes(app.status) ? "planlagt" : "aktiv",
    deadline: app.deadline || undefined,
    location: app.location || undefined,
    employmentType: app.employment_type || undefined,
    angle: app.angle || undefined,
    notes: app.notes || undefined,
    contactName: app.contact_name || undefined,
    contactEmail: app.contact_email || undefined,
    contactPhone: app.contact_phone || undefined,
    sentAt: app.sent_at || undefined,
    interviewDates: app.interview_dates || undefined,
    cvText: app.cv_text || undefined,
    coverLetterText: app.cover_letter_text || undefined,
    folder: "",
    resources: [],
  };
}

function summarise(apps: DashboardApp[]) {
  return {
    total: apps.length,
    sent: apps.filter(a => ["sendt", "intervju", "avslått", "tilbud", "ansatt"].includes(a.status)).length,
    interview: apps.filter(a => a.status === "intervju").length,
    planned: apps.filter(a => ["planlagt", "forberedes"].includes(a.status)).length,
    offers: apps.filter(a => a.status === "tilbud").length,
    hired: apps.filter(a => a.status === "ansatt").length,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUserServer();
  
  let apps: DashboardApp[] = [];
  
  try {
    // Load applications from Supabase
    const supabaseApps = await listApplications({
      organizationId: user?.organizationId,
      userId: user?.role === "client" ? user?.id : undefined,
    });
    apps = supabaseApps.map(mapSupabaseApp);
  } catch (error) {
    console.error("Failed to load applications:", error);
    // Return empty array on error
  }
  
  const summary = summarise(apps);

  const sentApps = apps.filter((a) => a.status === "sendt" || a.status === "forberedes");
  const interviewApps = apps.filter((a) => a.status === "intervju");
  const plannedApps = apps.filter((a) => a.type === "planlagt");
  const avslåttApps = apps.filter((a) => a.status === "avslått");
  
  // Build reminders from apps (simplified version)
  const contactReminders = apps
    .filter(a => a.status === "sendt" && a.sentAt)
    .map(a => ({
      id: a.id,
      company: a.company,
      type: "kontakt1" as const,
      label: "Kontakt 1",
      daysLeft: a.sentAt ? Math.floor((Date.now() - new Date(a.sentAt).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
    }))
    .slice(0, 10);

  const intervjuReminders = apps
    .filter(a => a.status === "intervju" && a.interviewDates?.length)
    .map(a => ({
      id: a.id,
      company: a.company,
      type: "intervju1" as const,
      label: "Intervju",
      daysLeft: 0,
    }))
    .slice(0, 5);

  return (
    <DashboardContent
      apps={apps}
      summary={summary}
      sentApps={sentApps}
      interviewApps={interviewApps}
      plannedApps={plannedApps}
      avslåttApps={avslåttApps}
      contactReminders={contactReminders}
      intervjuReminders={intervjuReminders}
      dreamCompanies={[]}
      groupedDreams={{}}
    />
  );
}
