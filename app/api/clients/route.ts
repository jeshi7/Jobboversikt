import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getSessionFromRequest(request: NextRequest) {
  const sessionId = request.headers.get("x-session-id") || 
    request.cookies.get("sessionId")?.value;
  
  if (!sessionId) return null;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("id", sessionId)
    .single();
  
  if (!session || new Date(session.expires_at) < new Date()) {
    return null;
  }
  
  const { data: user } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", session.user_id)
    .single();
  
  return user;
}

export async function GET(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const organizationId = searchParams.get("organizationId") || user.organization_id;
  
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
  const user = await getSessionFromRequest(request);
  
  if (!user) {
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
      organization_id: user.organization_id,
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
