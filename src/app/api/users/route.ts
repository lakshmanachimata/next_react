import { NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { User } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return unauthorized();
  }

  const db = getDb();
  const users = db
    .prepare(
      `SELECT id, name, email, username, role, created_at
       FROM users
       ORDER BY id ASC`
    )
    .all() as User[];

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const role = body.role === "admin" ? "admin" : "user";

    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: "Name, email, username, and password are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const passwordHash = hashPassword(password);

    const result = db
      .prepare(
        `INSERT INTO users (name, email, username, password_hash, role)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(name, email, username, passwordHash, role);

    const user = db
      .prepare(
        `SELECT id, name, email, username, role, created_at
         FROM users WHERE id = ?`
      )
      .get(result.lastInsertRowid) as User;

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("UNIQUE")
        ? "Email or username already exists"
        : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
