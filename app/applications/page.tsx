import { loadApplications } from "../../lib/applications";
import { Heading, BodyShort, Button } from "@navikt/ds-react";
import { ApplicationsList } from "../components/ApplicationsList";
import { getCurrentUserServer } from "../../lib/get-current-user-server";
import { getClientsByOrganization } from "../../lib/db";

export default async function ApplicationsPage() {
  const user = await getCurrentUserServer();
  
  // Get clientId if user is a client
  let clientId: string | undefined;
  if (user?.role === "client" && user?.email) {
    const clients = getClientsByOrganization(user.organizationId);
    const client = clients.find(c => c.email === user.email);
    clientId = client?.id;
  }
  
  const apps = loadApplications({
    userRole: user?.role,
    userOrganizationId: user?.organizationId,
    userId: user?.id,
    selectedClientId: clientId || undefined
  });

  return (
    <div className="space-y-6">
      <header>
        <Heading level="1" size="medium">
          Søknader
        </Heading>
        <BodyShort size="small" className="mt-1 max-w-2xl text-slate-600">
          En rolig liste over planlagte og sendte søknader, koblet til dokumentene i systemet.
        </BodyShort>
        <div className="mt-4">
          <Button
            as="a"
            href="/api/export?format=csv"
            size="small"
            variant="secondary"
          >
            📥 Eksporter til CSV
          </Button>
        </div>
      </header>

      <section>
        <ApplicationsList apps={apps} />
      </section>
    </div>
  );
}


