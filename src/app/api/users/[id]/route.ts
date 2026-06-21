import { NextResponse } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { User } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function parseId(rawId: string) {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return unauthorized();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const db = getDb();
  const user = db
    .prepare(
      `SELECT id, name, email, username, role, created_at
       FROM users WHERE id = ?`
    )
    .get(id) as User | undefined;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return unauthorized();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const username = String(body.username ?? "").trim();
    const password = body.password ? String(body.password) : "";
    const role = body.role === "admin" ? "admin" : "user";

    if (!name || !email || !username) {
      return NextResponse.json(
        { error: "Name, email, and username are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    if (password) {
      db.prepare(
        `UPDATE users
         SET name = ?, email = ?, username = ?, password_hash = ?, role = ?
         WHERE id = ?`
      ).run(name, email, username, hashPassword(password), role, id);
    } else {
      db.prepare(
        `UPDATE users
         SET name = ?, email = ?, username = ?, role = ?
         WHERE id = ?`
      ).run(name, email, username, role, id);
    }

    const user = db
      .prepare(
        `SELECT id, name, email, username, role, created_at
         FROM users WHERE id = ?`
      )
      .get(id) as User | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("UNIQUE")
        ? "Email or username already exists"
        : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return unauthorized();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  if (session.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
