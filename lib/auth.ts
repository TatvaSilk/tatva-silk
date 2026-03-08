// lib/auth.ts
import { cookies } from 'next/headers';
import { cache } from 'react';
import { z } from 'zod';

export type Role = 'admin' | 'manager' | 'customer';

const SessionSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  role: z.enum(['admin','manager','customer'])
});

export const getSession = cache(async () => {
  const token = cookies().get('session')?.value;
  if (!token) return null;

  // Replace with your real session decoding/lookup
  try {
    const raw = JSON.parse(Buffer.from(token, 'base64').toString());
    return SessionSchema.parse(raw);
  } catch {
    return null;
  }
});

export async function requireRole(roles: Role[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
