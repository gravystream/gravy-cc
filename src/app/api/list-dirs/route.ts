import { NextResponse } from "next/server";
import { readdirSync, existsSync } from "fs";
export async function GET() {
  const paths = [
    "/var/www/gravy-cc-deploy/src/lib",
    "/var/www/gravy-cc-deploy/src/app/go",
    "/var/www/gravy-cc-deploy/src/workers",
  ];
  const result: Record<string, string[]> = {};
  for (const p of paths) {
    try {
      if (existsSync(p)) result[p] = readdirSync(p);
      else result[p] = ["NOT_FOUND"];
    } catch(e) { result[p] = ["ERROR: " + e.message]; }
  }
  return NextResponse.json(result);
}