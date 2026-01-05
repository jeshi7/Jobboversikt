import { loadApplications } from "../../lib/applications";
import { Heading, BodyShort } from "@navikt/ds-react";
import { ResourcesList } from "../components/ResourcesList";
import { getCurrentUserServer } from "../../lib/get-current-user-server";
import { getClientsByOrganization } from "../../lib/db";

export default async function ResourcesPage({
  searchParams
}: {
  searchParams?: { clientId?: string };
}) {
  const user = await getCurrentUserServer();
  
  // Get clientId for filtering
  let clientId: string | undefined;
  
  if (user?.role === "client" && user?.email) {
    // Client sees only their own resources
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

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <BodyShort
          size="small"
          className="text-xs uppercase tracking-[0.25em] text-slate-500"
        >
          Ressurser
        </BodyShort>
        <Heading level="1" size="medium">
          Alt innholdet samlet på ett rolig sted
        </Heading>
        <BodyShort size="small" className="max-w-2xl text-slate-600">
          CV-er, søknadsbrev, utlysninger og notater, organisert etter selskap og hentet direkte fra mappene.
        </BodyShort>
      </header>

      <section>
        <ResourcesList apps={apps} />
      </section>
    </div>
  );
}

function getPrimaryResources(
  resources: { name: string; relativePath: string }[],
  limit: number
) {
  const important = resources.filter((r) =>
    /cv|søknadsbrev|cover|utlysning/i.test(r.name)
  );
  const base = important.length > 0 ? important : resources;
  return base.slice(0, limit);
}

