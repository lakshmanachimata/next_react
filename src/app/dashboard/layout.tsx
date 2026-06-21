"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/types";
import styles from "./dashboard.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const data = await response.json();
      setUser(data.user);
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <div>
            <p className={styles.brand}>Task Manager</p>
            {user ? <p className={styles.welcome}>Hello, {user.name}</p> : null}
          </div>

          <nav className={styles.nav}>
            <Link
              href="/dashboard"
              className={pathname === "/dashboard" ? styles.active : ""}
            >
              Overview
            </Link>
            <Link
              href="/dashboard/users"
              className={pathname.startsWith("/dashboard/users") ? styles.active : ""}
            >
              Users
            </Link>
            <Link
              href="/dashboard/tasks"
              className={pathname.startsWith("/dashboard/tasks") ? styles.active : ""}
            >
              Tasks
            </Link>
            <button className="btn btn-secondary" onClick={handleLogout} type="button">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className={`container ${styles.main}`}>{children}</main>
    </div>
  );
}
