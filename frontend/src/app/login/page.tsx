"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { authRequest } from "@/lib/api";
import { setAuthState } from "@/lib/auth";
import { AuthResponse } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await authRequest<AuthResponse>("/auth/login", { email, password });
      setAuthState({ accessToken: data.accessToken, user: data.user });
      toast.success("Welcome back");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <h1>TaskPilot Login</h1>
        <p>Sign in to manage your tasks securely.</p>

        <form onSubmit={onSubmit} className="form-stack">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          <button disabled={loading} type="submit">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="switch-link">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
