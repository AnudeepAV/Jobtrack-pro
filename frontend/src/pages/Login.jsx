import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getAccessToken, setAccessToken, setRefreshToken } from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, go straight to dashboard
  useEffect(() => {
    const token = getAccessToken();
    if (token) nav("/dashboard", { replace: true });
  }, [nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const u = username.trim();
      const p = password;

      if (!u || !p) {
        setErr("Please enter username and password.");
        return;
      }

      // api baseURL already includes /api
      // So endpoint is /auth/login/
      const res = await api.post("/auth/login/", { username: u, password: p });

      const access = res?.data?.access;
      const refresh = res?.data?.refresh;

      if (!access || !refresh) {
        setErr("Login response did not include access/refresh tokens.");
        return;
      }

      setAccessToken(access);
      setRefreshToken(refresh);

      nav("/dashboard", { replace: true });
    } catch (e2) {
      const status = e2?.response?.status;

      // Most common: wrong credentials
      if (status === 401 || status === 403) {
        setErr("Login failed. Check username/password.");
      } else {
        const msg =
          e2?.response?.data?.detail ||
          e2?.response?.data?.message ||
          e2?.message ||
          "Login failed.";
        setErr(msg);
      }
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
