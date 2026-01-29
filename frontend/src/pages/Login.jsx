import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api, { setAccessToken, setRefreshToken } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Your backend routes: /api/auth/login/
      const res = await api.post("/auth/login/", {
        username,
        password,
      });

      // SimpleJWT returns: { access: "...", refresh: "..." }
      const access = res?.data?.access;
      const refresh = res?.data?.refresh;

      if (!access) {
        setError("Login response did not include access token.");
        setLoading(false);
        return;
      }

      setAccessToken(access);
      if (refresh) setRefreshToken(refresh);

      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Login failed. Check username/password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div
        style={{
          width: 420,
          padding: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          background: "#fff",
        }}
      >
        <h2 style={{ margin: 0 }}>Login</h2>
        <p style={{ marginTop: 6, color: "#6b7280" }}>
          Sign in to view your job dashboard.
        </p>

        {error ? (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: 10,
              borderRadius: 10,
              marginBottom: 12,
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit}>
          <label style={{ display: "block", marginTop: 10, fontSize: 13 }}>
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            style={{
              width: "100%",
              marginTop: 6,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              boxSizing: "border-box",
            }}
          />

          <label style={{ display: "block", marginTop: 12, fontSize: 13 }}>
            Password
          </label>
          <input
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            style={{
              width: "100%",
              marginTop: 6,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: "#111827",
              color: "white",
              fontWeight: 600,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
          Login endpoint: <code>/auth/login/</code>
        </div>
      </div>
    </div>
  );
}
