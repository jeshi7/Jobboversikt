import { NextRequest, NextResponse } from "next/server";
import { scanLocalData, getDefaultDataPath } from "../../../../lib/migration-utils";
import { getSession, getAuthUser } from "../../../../lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Migration only available in development mode" },
      { status: 403 }
    );
  }
  
  // Check authentication
  const sessionId = req.headers.get("x-session-id");
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  
  const user = await getAuthUser(session.userId);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  
  try {
    const body = await req.json();
    const { organizationId, clientId } = body;
    
    if (!organizationId || !clientId) {
      return NextResponse.json(
        { error: "organizationId and clientId are required" },
        { status: 400 }
      );
    }
    
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Scan local data
    const dataPath = getDefaultDataPath();
    const result = scanLocalData(dataPath);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to scan local data", details: result.errors },
        { status: 500 }
      );
    }
    
    const importResults = {
      applicationsCreated: 0,
      competenceBankUpdated: false,
      errors: [] as string[],
    };
    
    // Import applications
    for (const app of result.applications) {
      try {
        // Check if application already exists
        const { data: existing } = await supabase
          .from("applications")
          .select("id")
          .eq("company", app.company)
          .eq("client_id", clientId)
          .single();
        
        if (existing) {
          // Update existing application
          const { error: updateError } = await supabase
            .from("applications")
            .update({
              job_title: app.jobTitle,
              status: app.status,
              deadline: app.deadline && app.deadline !== "Snarest" && app.deadline !== "Åpen søknad" 
                ? null // Date parsing would need to be done properly
                : null,
              location: app.location,
              employment_type: app.employmentType,
              listing_url: app.listingUrl,
              angle: app.angle,
              contact_name: app.contactName,
              notes: app.notes,
              cv_text: app.cvText,
              cover_letter_text: app.coverLetterText,
              sent_at: app.sentAt ? new Date(app.sentAt).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          
          if (updateError) {
            importResults.errors.push(`Failed to update ${app.company}: ${updateError.message}`);
          } else {
            importResults.applicationsCreated++;
          }
        } else {
          // Create new application
          const { error: insertError } = await supabase
            .from("applications")
            .insert({
              user_id: session.userId,
              organization_id: organizationId,
              client_id: clientId,
              company: app.company,
              job_title: app.jobTitle,
              status: app.status,
              location: app.location,
              employment_type: app.employmentType,
              listing_url: app.listingUrl,
              angle: app.angle,
              contact_name: app.contactName,
              notes: app.notes,
              cv_text: app.cvText,
              cover_letter_text: app.coverLetterText,
              sent_at: app.sentAt ? new Date(app.sentAt).toISOString() : null,
            });
          
          if (insertError) {
            importResults.errors.push(`Failed to create ${app.company}: ${insertError.message}`);
          } else {
            importResults.applicationsCreated++;
          }
        }
      } catch (err) {
        importResults.errors.push(`Error processing ${app.company}: ${err}`);
      }
    }
    
    // Update competence bank if available
    if (result.competenceBank) {
      try {
        // Check if competence bank exists for client
        const { data: existingCB } = await supabase
          .from("competence_banks")
          .select("id")
          .eq("client_id", clientId)
          .single();
        
        // Parse competence bank content (simplified - stores as notes)
        const competenceData = {
          client_id: clientId,
          notes: result.competenceBank,
          skills: ["UX Design", "Grafisk Design", "Innholdsproduksjon", "Video", "Web"],
          updated_at: new Date().toISOString(),
        };
        
        if (existingCB) {
          await supabase
            .from("competence_banks")
            .update(competenceData)
            .eq("id", existingCB.id);
        } else {
          await supabase
            .from("competence_banks")
            .insert(competenceData);
        }
        
        importResults.competenceBankUpdated = true;
      } catch (err) {
        importResults.errors.push(`Error updating competence bank: ${err}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      ...importResults,
      totalApplications: result.applications.length,
    });
    
  } catch (error) {
    console.error("Migration import error:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}

