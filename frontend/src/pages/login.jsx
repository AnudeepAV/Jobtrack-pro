import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import api from "../lib/api";
import { setTokens } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login/", { username, password });
      setTokens(res.data);
      navigate("/dashboard");
    } catch (error) {
      const msg =
        error?.response?.data?.detail ||
        "Login failed. Check username/password.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">JobTrack Pro</h1>
            <p className="text-slate-600 mt-1">
              Sign in to manage and track your applications.
            </p>
          </div>

          {err ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
              {err}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Username
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-slate-300">
                <User className="h-4 w-4 text-slate-500" />
                <input
                  className="w-full outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-slate-300">
                <Lock className="h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  className="w-full outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-5">
            Tip: use your Django superuser credentials for now.
          </p>
        </div>
      </div>
    </div>
  );
}
