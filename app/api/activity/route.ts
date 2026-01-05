import { NextResponse } from "next/server";
import { loadApplications } from "../../../lib/applications";

export async function GET() {
  const apps = loadApplications();

  // Get last 365 days
  const days: { date: string; count: number }[] = [];
  const today = new Date();

  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Count activities on this day (based on sentAt dates)
    const count = apps.filter((app) => {
      if (!app.sentAt) return false;
      const sentDate = app.sentAt.toISOString().split("T")[0];
      return sentDate === dateStr;
    }).length;

    days.push({ date: dateStr, count });
  }

  return NextResponse.json({ days });
}







