"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const [userCount, setUserCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    async function loadCounts() {
      const [usersResponse, tasksResponse] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/tasks"),
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUserCount(usersData.users.length);
      }

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTaskCount(tasksData.tasks.length);
      }
    }

    loadCounts();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span>Total Users</span>
          <strong>{userCount}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Total Tasks</span>
          <strong>{taskCount}</strong>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: "0.75rem" }}>Quick links</h2>
        <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
          Use the navigation above to create, edit, and delete users and tasks.
        </p>
        <div className="actions">
          <Link className="btn" href="/dashboard/users">
            Manage Users
          </Link>
          <Link className="btn btn-secondary" href="/dashboard/tasks">
            Manage Tasks
          </Link>
        </div>
      </div>
    </div>
  );
}
