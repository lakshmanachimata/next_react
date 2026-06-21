export type UserRole = "admin" | "user";

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  assigned_user_id: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  assigned_user_name?: string | null;
  created_by_name?: string | null;
}

export interface SessionUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
}
