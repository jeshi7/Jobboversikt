import { saveOrganization, saveUser, saveClient } from "../lib/db";
import { saveCompetenceBank } from "../lib/db";

// Seed demo data
const demoOrg = {
  id: "org-demo-1",
  name: "NAV Sarpsborg",
  slug: "nav-sarpsborg",
  createdAt: new Date().toISOString(),
  settings: {
    autoGenerateCV: true,
    autoGenerateCoverLetter: true,
    autoCreateFolders: true
  }
};

const demoOrg2 = {
  id: "org-demo-2",
  name: "Sens Arbeidsinkludering",
  slug: "sens",
  createdAt: new Date().toISOString(),
  settings: {
    autoGenerateCV: true,
    autoGenerateCoverLetter: true,
    autoCreateFolders: true
  }
};

const demoUsers = [
  {
    id: "user-admin-1",
    organizationId: demoOrg.id,
    email: "admin@demo.no",
    name: "Admin Bruker",
    role: "admin" as const,
    createdAt: new Date().toISOString()
  },
  {
    id: "user-consultant-1",
    organizationId: demoOrg.id,
    email: "konsulent@demo.no",
    name: "Konsulent Bruker",
    role: "consultant" as const,
    createdAt: new Date().toISOString()
  },
  {
    id: "user-client-1",
    organizationId: demoOrg.id,
    email: "jessie.macharia@demo.no",
    name: "Jessie Macharia",
    role: "client" as const,
    createdAt: new Date().toISOString()
  }
];

const demoClient = {
  id: "client-jessie-1",
  organizationId: demoOrg.id,
  name: "Jessie Macharia",
  email: "jessie.macharia@demo.no",
  createdAt: new Date().toISOString()
};

console.log("🌱 Seeding demo data...");

// Create organizations
saveOrganization(demoOrg);
console.log("✅ Created organization: NAV Sarpsborg");

saveOrganization(demoOrg2);
console.log("✅ Created organization: Sens Arbeidsinkludering");

// Create users
demoUsers.forEach(user => {
  saveUser(user);
  console.log(`✅ Created user: ${user.email} (${user.role})`);
});

// Create client
saveClient(demoClient);
console.log("✅ Created client: Jessie Macharia");

console.log("\n🎉 Demo data seeded successfully!");
console.log("\n📝 Demo credentials:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Admin:");
console.log("  Email: admin@demo.no");
console.log("  Passord: (ingen passord i demo)");
console.log("\nKonsulent:");
console.log("  Email: konsulent@demo.no");
console.log("  Passord: (ingen passord i demo)");
console.log("\nKlient:");
console.log("  Email: jessie.macharia@demo.no");
console.log("  Passord: (ingen passord i demo)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");







