import React, { useState } from "react";
import api, { setAccessToken } from "../lib/api";

function setRefreshToken(token) {
  localStorage.setItem("refresh_token", token);
}

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Configure endpoint from .env, fallback to your current one
  const LOGIN_PATH = import.meta.env.VITE_AUTH_LOGIN_PATH || "/auth/login/";

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // ✅ THIS is the correct syntax (2 arguments)
      const data = await api.post(LOGIN_PATH, {
        username: username,
        password: password,
      });

      if (!data || !data.access) {
        throw new Error("Login response did not include access token.");
      }

      setAccessToken(data.access);

      if (data.refresh) {
        setRefreshToken(data.refresh);
      }

      if (typeof onSuccess === "function") {
        onSuccess();
      }

      // Optional redirect (helps if you don't have router redirect logic)
      if (window.location.pathname.toLowerCase().includes("login")) {
        window.location.href = "/";
      }
    } catch (e2) {
      const msg =
        (e2 && e2.data && (e2.data.detail || e2.data.message)) ||
        e2.message ||
        "Login failed. Check username/password.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 16,
          background: "white",
        }}
      >
        <h2 style={{ margin: 0 }}>Login</h2>
        <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
          Sign in to view your job dashboard.
        </div>

        {err ? (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              background: "#fff1f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: 13,
            }}
          >
            {err}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Username</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Enter username"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginTop: 6,
              }}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginTop: 6,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "white",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
            Login endpoint: <code>{LOGIN_PATH}</code>
          </div>
        </form>
      </div>
    </div>
  );
}
