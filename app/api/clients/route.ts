import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "../../../lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const organizationId = searchParams.get("organizationId") || session.organizationId;
  
  if (id) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !data) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  }
  
  // Get clients for organization
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  if (!body.name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: session.organizationId,
      user_id: body.userId || null,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      notes: body.notes || null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
