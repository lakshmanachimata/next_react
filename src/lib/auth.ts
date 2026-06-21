import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getDb } from "./db";
import {
  COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
} from "./session";
import type { SessionUser, UserWithPassword } from "./types";

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export function findUserByUsername(
  username: string
): UserWithPassword | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, name, email, username, password_hash, role, created_at
       FROM users WHERE username = ?`
    )
    .get(username) as UserWithPassword | undefined;
}

export function verifyPassword(
  plainPassword: string,
  passwordHash: string
): boolean {
  return bcrypt.compareSync(plainPassword, passwordHash);
}

export function hashPassword(plainPassword: string): string {
  return bcrypt.hashSync(plainPassword, 10);
}

export { COOKIE_NAME, createSessionToken, verifySessionToken };
