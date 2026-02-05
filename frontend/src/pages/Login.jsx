import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAccessToken, setRefreshToken } from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // IMPORTANT: api baseURL already includes /api
      // So endpoint is /auth/login/
      const res = await api.post("/auth/login/", { username, password });

      const access = res?.data?.access;
      const refresh = res?.data?.refresh;

      if (!access || !refresh) {
        setErr("Login response did not include access token.");
        setLoading(false);
        return;
      }

      setAccessToken(access);
      setRefreshToken(refresh);

      nav("/dashboard");
    } catch (e2) {
      // show backend error if present
      const msg =
        e2?.response?.data?.detail ||
        e2?.response?.data?.message ||
        "Login failed. Check username/password.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md border border-gray-200 rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold">Login</h2>
        <p className="text-sm text-gray-500 mt-1">
          Sign in to view your job dashboard.
        </p>

        {err && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm">
            {err}
          </div>
        )}

        <label className="block mt-4 text-sm font-medium">Username</label>
        <input
          className="mt-2 w-full p-3 border border-gray-200 rounded-xl"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          autoComplete="username"
        />

        <label className="block mt-4 text-sm font-medium">Password</label>
        <input
          className="mt-2 w-full p-3 border border-gray-200 rounded-xl"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          autoComplete="current-password"
        />

        <button
          className="mt-6 w-full p-3 rounded-xl bg-gray-900 text-white font-medium disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="mt-3 text-xs text-gray-500">
          Login endpoint: <code>/auth/login/</code>
        </div>
      </form>
    </div>
  );
}
