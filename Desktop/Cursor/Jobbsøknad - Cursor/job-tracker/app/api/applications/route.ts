import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Force dynamic to ensure we read the latest file at runtime if possible, 
// though on Vercel the file system is read-only usually.
// Better to import it if it's bundled.
// But importing JSON in TS needs resolveJsonModule (which we have).
// Let's try dynamic require to avoid build errors if file missing initially,
// or just standard import and rely on prebuild.

export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), 'app', 'data-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      return NextResponse.json(data);
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error reading manifest:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
