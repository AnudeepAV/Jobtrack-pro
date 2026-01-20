import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { clearTokens } from "../lib/auth";
import { daysSince, prettyDate } from "../lib/dates";

function StatusBadge({ status }) {
  const map = {
    applied: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    ghosted: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const label = {
    applied: "Applied",
    in_progress: "In Progress",
    accepted: "Accepted",
    rejected: "Rejected",
    ghosted: "Ghosted",
  };

  const cls = map[status] || map.ghosted;

  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium " +
        cls
      }
    >
      {label[status] || status}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function logout() {
    clearTokens();
    navigate("/login");
  }

  async function loadJobs() {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/jobs/");
      setJobs(res.data);
    } catch (error) {
      const code = error?.response?.status;
      if (code === 401) {
        clearTokens();
        navigate("/login");
        return;
      }
      setErr("Failed to load jobs. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchQ =
        !query ||
        (j.company_name || "").toLowerCase().includes(query) ||
        (j.job_title || "").toLowerCase().includes(query);
      const matchStatus = !statusFilter || j.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [jobs, q, statusFilter]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const inProgress = jobs.filter((j) => j.status === "in_progress").length;
    const rejected = jobs.filter((j) => j.status === "rejected").length;
    return { total, inProgress, rejected };
  }, [jobs]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 text-sm">
              Track applications, statuses, and follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadJobs}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100 transition"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <p className="text-slate-600 text-sm">Total Applications</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <p className="text-slate-600 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {stats.inProgress}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <p className="text-slate-600 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {stats.rejected}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-slate-900">
              Applications
            </h2>

            <div className="flex gap-2 flex-wrap">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Search company or title..."
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">All Status</option>
                <option value="applied">Applied</option>
                <option value="in_progress">In Progress</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="ghosted">Ghosted</option>
              </select>
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
              {err}
            </div>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-600 text-sm border-b">
                  <th className="py-2">Company</th>
                  <th className="py-2">Title</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Applied</th>
                  <th className="py-2">Days</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr className="border-b">
                    <td className="py-4 text-slate-600" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr className="border-b">
                    <td className="py-4 text-slate-600" colSpan={5}>
                      No jobs found. Add one using Django admin or your
                      extension endpoint.
                    </td>
                  </tr>
                ) : (
                  filtered.map((j) => (
                    <tr key={j.id} className="border-b text-slate-800">
                      <td className="py-3 font-medium">{j.company_name}</td>
                      <td className="py-3">{j.job_title}</td>
                      <td className="py-3">
                        <StatusBadge status={j.status} />
                      </td>
                      <td className="py-3">{prettyDate(j.date_applied)}</td>
                      <td className="py-3">{daysSince(j.date_applied)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
