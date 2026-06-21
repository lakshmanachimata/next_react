"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User, UserRole } from "@/lib/types";

const emptyForm = {
  name: "",
  email: "",
  username: "",
  password: "",
  role: "user" as UserRole,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    const response = await fetch("/api/users");
    if (response.ok) {
      const data = await response.json();
      setUsers(data.users);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      username: user.username,
      password: "",
      role: user.role,
    });
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const payload = {
      name: form.name,
      email: form.email,
      username: form.username,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    };

    const response = await fetch(
      editingId ? `/api/users/${editingId}` : "/api/users",
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
    await loadUsers();
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Delete failed");
      return;
    }

    if (editingId === id) {
      resetForm();
    }
    await loadUsers();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2 style={{ marginBottom: "1rem" }}>
            {editingId ? "Edit User" : "Create User"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                value={form.username}
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">
                Password {editingId ? "(leave blank to keep current)" : ""}
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                required={!editingId}
              />
            </div>

            <div className="field">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as UserRole })
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {error ? <p className="error">{error}</p> : null}

            <div className="actions">
              <button className="btn" type="submit">
                {editingId ? "Update User" : "Create User"}
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
          <h2 style={{ marginBottom: "1rem" }}>All Users</h2>

          {loading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <p>No users yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                        @{user.username}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge badge-${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => startEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => handleDelete(user.id)}
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
