import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { Task, TaskStatus } from "@/lib/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const VALID_STATUSES: TaskStatus[] = ["pending", "in_progress", "completed"];

function isValidStatus(status: string): status is TaskStatus {
  return VALID_STATUSES.includes(status as TaskStatus);
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return unauthorized();
  }

  const db = getDb();
  const tasks = db
    .prepare(
      `SELECT
         t.id,
         t.title,
         t.description,
         t.status,
         t.assigned_user_id,
         t.created_by,
         t.created_at,
         t.updated_at,
         au.name AS assigned_user_name,
         cu.name AS created_by_name
       FROM tasks t
       LEFT JOIN users au ON au.id = t.assigned_user_id
       LEFT JOIN users cu ON cu.id = t.created_by
       ORDER BY t.id DESC`
    )
    .all() as Task[];

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const status = String(body.status ?? "pending");
    const assignedUserId = body.assigned_user_id
      ? Number(body.assigned_user_id)
      : null;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!isValidStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = getDb();

    if (assignedUserId) {
      const userExists = db
        .prepare("SELECT id FROM users WHERE id = ?")
        .get(assignedUserId);
      if (!userExists) {
        return NextResponse.json(
          { error: "Assigned user not found" },
          { status: 400 }
        );
      }
    }

    const result = db
      .prepare(
        `INSERT INTO tasks (title, description, status, assigned_user_id, created_by)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(title, description, status, assignedUserId, session.id);

    const task = db
      .prepare(
        `SELECT
           t.id,
           t.title,
           t.description,
           t.status,
           t.assigned_user_id,
           t.created_by,
           t.created_at,
           t.updated_at,
           au.name AS assigned_user_name,
           cu.name AS created_by_name
         FROM tasks t
         LEFT JOIN users au ON au.id = t.assigned_user_id
         LEFT JOIN users cu ON cu.id = t.created_by
         WHERE t.id = ?`
      )
      .get(result.lastInsertRowid) as Task;

    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
