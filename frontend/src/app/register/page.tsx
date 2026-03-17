"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { authRequest } from "@/lib/api";
import { setAuthState } from "@/lib/auth";
import { AuthResponse } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await authRequest<AuthResponse>("/auth/register", {
        name: name || undefined,
        email,
        password,
      });
      setAuthState({ accessToken: data.accessToken, user: data.user });
      toast.success("Account created");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p>Get started with your personal task workspace.</p>

        <form onSubmit={onSubmit} className="form-stack">
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Optional"
            />
          </label>

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
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="switch-link">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}
