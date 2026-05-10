import crypto from 'crypto';
import { db } from '@/lib/db';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateCode(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return result;
}

export async function generateUniqueShortCode(length = 8): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateCode(length);
    const existing = await db.trackingLink.findUnique({
      where: { shortCode: code },
    });
    if (!existing) return code;
    attempts++;
  }
  throw new Error('Failed to generate unique short code after 10 attempts');
}
