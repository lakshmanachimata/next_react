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
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const db = getDb();
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
    .get(id) as Task | undefined;

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
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
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
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
        `UPDATE tasks
         SET title = ?, description = ?, status = ?, assigned_user_id = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(title, description, status, assignedUserId, id);

    if (result.changes === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

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
      .get(id) as Task;

    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
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
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
