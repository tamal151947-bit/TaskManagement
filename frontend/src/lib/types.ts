import { User } from "./auth";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type TaskListResponse = {
  items: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};
