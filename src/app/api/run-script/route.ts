import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json();
    if (!script) return NextResponse.json({ error: 'No script path' }, { status: 400 });
    const output = execSync('node ' + script, { encoding: 'utf8', timeout: 10000 });
    return NextResponse.json({ ok: true, output });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stderr: error.stderr }, { status: 500 });
  }
}