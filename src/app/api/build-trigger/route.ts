import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== "Bearer novaclio-build-secret") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { command } = await request.json();
    
    // Only allow specific safe commands
    const allowedCommands = [
      "cd /var/www/gravy-cc-deploy && npm run build",
      "cd /var/www/gravy-cc-deploy && npx pm2 restart novaclio",
      "cd /var/www/gravy-cc-deploy && npm run build && npx pm2 restart novaclio",
      "cd /var/www/gravy-cc-deploy && npm install bullmq",
    ];
    
    if (!allowedCommands.includes(command)) {
      return NextResponse.json({ error: "Command not allowed" }, { status: 403 });
    }

    const { stdout, stderr } = await execAsync(command, { 
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10 
    });
    
    return NextResponse.json({ ok: true, stdout: stdout.slice(-2000), stderr: stderr.slice(-2000) });
  } catch (error) {
    return NextResponse.json({ 
      error: error.message, 
      stdout: error.stdout?.slice(-2000), 
      stderr: error.stderr?.slice(-2000) 
    }, { status: 500 });
  }
}