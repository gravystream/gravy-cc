import { NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "read") {
      const content = await readFile(body.path, "utf-8");
      return NextResponse.json({ content });
    }

    if (body.action === "exec") {
      const { stdout, stderr } = await execAsync(body.command, {
        timeout: 300000,
        maxBuffer: 10 * 1024 * 1024,
        cwd: body.cwd || "/var/www/gravy-cc-deploy"
      });
      return NextResponse.json({ stdout, stderr });
    }

    // Default: write file
    await mkdir(dirname(body.path), { recursive: true });
    await writeFile(body.path, body.content, "utf-8");
    return NextResponse.json({ ok: true, path: body.path });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}