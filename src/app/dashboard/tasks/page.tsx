"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Task, TaskStatus, User } from "@/lib/types";

const emptyForm = {
  title: "",
  description: "",
  status: "pending" as TaskStatus,
  assigned_user_id: "",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [tasksResponse, usersResponse] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/users"),
    ]);

    if (tasksResponse.ok) {
      const tasksData = await tasksResponse.json();
      setTasks(tasksData.tasks);
    }

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      setUsers(usersData.users);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      assigned_user_id: task.assigned_user_id
        ? String(task.assigned_user_id)
        : "",
    });
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      assigned_user_id: form.assigned_user_id
        ? Number(form.assigned_user_id)
        : null,
    };

    const response = await fetch(
      editingId ? `/api/tasks/${editingId}` : "/api/tasks",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Request failed");
      return;
    }

    resetForm();
    await loadData();
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Delete failed");
      return;
    }

    if (editingId === id) {
      resetForm();
    }
    await loadData();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tasks</h1>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2 style={{ marginBottom: "1rem" }}>
            {editingId ? "Edit Task" : "Create Task"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </div>

            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as TaskStatus })
                }
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="assigned_user_id">Assign To</label>
              <select
                id="assigned_user_id"
                value={form.assigned_user_id}
                onChange={(event) =>
                  setForm({ ...form, assigned_user_id: event.target.value })
                }
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {error ? <p className="error">{error}</p> : null}

            <div className="actions">
              <button className="btn" type="submit">
                {editingId ? "Update Task" : "Create Task"}
              </button>
              {editingId ? (
                <button className="btn btn-secondary" type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="card">
          <h2 style={{ marginBottom: "1rem" }}>All Tasks</h2>

          {loading ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p>No tasks yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <strong>{task.title}</strong>
                      {task.description ? (
                        <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                          {task.description}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`badge badge-${task.status}`}>
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>{task.assigned_user_name ?? "Unassigned"}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => startEdit(task)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => handleDelete(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
