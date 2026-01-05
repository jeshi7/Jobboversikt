import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../../lib/supabase";
import { isDatabaseEmpty } from "../../../../lib/supabase-db";

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        needsSetup: true,
        reason: "supabase_not_configured",
        message: "Supabase er ikke konfigurert. Legg til miljøvariabler.",
      });
    }

    // Check if database is empty
    const isEmpty = await isDatabaseEmpty();
    
    return NextResponse.json({
      needsSetup: isEmpty,
      reason: isEmpty ? "no_organizations" : null,
    });
  } catch (error) {
    console.error("Setup check error:", error);
    return NextResponse.json(
      {
        needsSetup: true,
        reason: "error",
        message: error instanceof Error ? error.message : "Ukjent feil",
      },
      { status: 500 }
    );
  }
}

