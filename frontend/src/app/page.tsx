"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiRequest, ensureAccessToken } from "@/lib/api";
import { clearAuthState, getAuthState } from "@/lib/auth";
import { Task, TaskListResponse } from "@/lib/types";

type Filter = "ALL" | "PENDING" | "COMPLETED";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");

  const loadTasks = async (targetPage = page, targetFilter = filter, targetSearch = search) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("page", String(targetPage));
      query.set("limit", String(limit));
      if (targetFilter !== "ALL") {
        query.set("status", targetFilter);
      }
      if (targetSearch.trim()) {
        query.set("search", targetSearch.trim());
      }

      const data = await apiRequest<TaskListResponse>(`/tasks?${query.toString()}`);
      setTasks(data.items);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const auth = getAuthState();
      if (auth?.user?.name) {
        setUserName(auth.user.name);
      }

      const token = await ensureAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      await loadTasks(1, filter, search);
    };

    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEditingTaskId(null);
  };

  const submitTask = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = { title, description: description || undefined };
      if (editingTaskId) {
        await apiRequest(`/tasks/${editingTaskId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Task updated");
      } else {
        await apiRequest("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Task created");
      }

      resetForm();
      await loadTasks(1, filter, search);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? "");
  };

  const toggleTask = async (taskId: string) => {
    try {
      await apiRequest(`/tasks/${taskId}/toggle`, { method: "PATCH" });
      toast.success("Task status updated");
      await loadTasks(page, filter, search);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Toggle failed");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
      toast.success("Task deleted");
      await loadTasks(page, filter, search);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const applySearch = async (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchInput);
    await loadTasks(1, filter, searchInput);
  };

  const changeFilter = async (nextFilter: Filter) => {
    setFilter(nextFilter);
    await loadTasks(1, nextFilter, search);
  };

  const onFilterClick = async (nextFilter: Filter) => {
    if (nextFilter === "ALL") {
      setFilter("ALL");
      setSearch("");
      setSearchInput("");
      await loadTasks(1, "ALL", "");
      return;
    }

    await changeFilter(nextFilter);
  };

  const logout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST", skipAuth: true });
    } finally {
      clearAuthState();
      router.push("/login");
    }
  };

  return (
    <main className="dashboard-screen">
      <section className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <h1>TaskPilot</h1>
            <p>Welcome, {userName}. Keep your momentum.</p>
          </div>
          <button onClick={logout} className="ghost" type="button">
            Logout
          </button>
        </header>

        <section className="task-form-card">
          <h2>{editingTaskId ? "Edit Task" : "Create Task"}</h2>
          <form onSubmit={submitTask} className="form-stack">
            <label>
              Title
              <input
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={2000}
              />
            </label>
            <div className="row-buttons">
              <button disabled={saving} type="submit">
                {saving ? "Saving..." : editingTaskId ? "Save Changes" : "Add Task"}
              </button>
              {editingTaskId ? (
                <button className="ghost" type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="task-list-card">
          <div className="task-controls">
            <form onSubmit={applySearch} className="search-form">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title"
              />
              <button type="submit">Search</button>
            </form>
            <div className="filter-row">
              {(["ALL", "PENDING", "COMPLETED"] as Filter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === filter ? "active" : "ghost"}
                  onClick={() => {
                    void onFilterClick(item);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? <p>Loading tasks...</p> : null}

          {!loading && tasks.length === 0 ? <p>No tasks found.</p> : null}

          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={task.status === "COMPLETED" ? "done" : ""}>
                <div>
                  <h3>{task.title}</h3>
                  {task.description ? <p>{task.description}</p> : null}
                  <small>{task.status === "COMPLETED" ? "Completed" : "Pending"}</small>
                </div>
                <div className="task-actions">
                  <button type="button" onClick={() => void toggleTask(task.id)}>
                    Toggle
                  </button>
                  <button className="ghost" type="button" onClick={() => startEdit(task)}>
                    Edit
                  </button>
                  <button className="danger" type="button" onClick={() => void deleteTask(task.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <footer className="pager">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                void loadTasks(page - 1, filter, search);
              }}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                void loadTasks(page + 1, filter, search);
              }}
            >
              Next
            </button>
          </footer>
        </section>
      </section>
    </main>
  );
}
