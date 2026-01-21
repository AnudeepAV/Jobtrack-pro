import React, { useEffect, useMemo, useState } from "react";
import api, { clearTokens } from "../lib/api";

function daysSince(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

function prettyDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [err, setErr] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const JOBS_LIST_PATH = import.meta.env.VITE_JOBS_LIST_PATH || "/jobs/";

  async function fetchJobs({ silent = false } = {}) {
    try {
      if (!silent) {
        setLoading(true);
        setErr("");
      }

      const data = await api.get(JOBS_LIST_PATH);
      const items = Array.isArray(data) ? data : data?.results || [];

      setJobs(items);
      setLastUpdated(new Date());
    } catch (e) {
      // If token invalid, force logout
      if (e?.status === 401) {
        clearTokens();
        window.location.href = "/login";
        return;
      }

      // ✅ IMPORTANT:
      // If it was a background poll, do NOT show the red banner.
      if (!silent) {
        setErr(e?.message || "Failed to load jobs.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs({ silent: false });

    const id = setInterval(() => {
      // background polling (no scary error banner)
      fetchJobs({ silent: true });
    }, 10000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredJobs = useMemo(() => {
    let list = jobs;

    if (statusFilter !== "all") {
      list = list.filter((j) => (j.status || "").toLowerCase() === statusFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((j) => {
        const company = (j.company_name || "").toLowerCase();
        const title = (j.job_title || "").toLowerCase();
        const url = (j.job_url || "").toLowerCase();
        return company.includes(q) || title.includes(q) || url.includes(q);
      });
    }

    list = [...list].sort((a, b) => {
      const da = new Date(a.date_applied || a.created_at || 0).getTime();
      const db = new Date(b.date_applied || b.created_at || 0).getTime();
      return db - da;
    });

    return list;
  }, [jobs, query, statusFilter]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company/title/url..."
            style={{
              width: 260,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              outline: "none",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: 180,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "white",
            }}
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="applied">Applied</option>
            <option value="ghosted">Ghosted</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
          </select>

          <button
            onClick={() => fetchJobs({ silent: false })}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "white",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {err ? (
        <div
          style={{
            padding: 12,
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#991b1b",
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      ) : null}

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", background: "white" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Total: <b style={{ color: "#111827" }}>{filteredJobs.length}</b>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 14, color: "#6b7280" }}>Loading…</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ padding: 14, color: "#6b7280" }}>
            No jobs found. Save a job from the extension, then wait a few seconds.
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 13, color: "#6b7280" }}>
                  <th style={{ padding: 12 }}>Company</th>
                  <th style={{ padding: 12 }}>Title</th>
                  <th style={{ padding: 12 }}>Status</th>
                  <th style={{ padding: 12 }}>Applied</th>
                  <th style={{ padding: 12 }}>Days</th>
                  <th style={{ padding: 12 }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j) => (
                  <tr key={j.id || j.job_url} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: 12, fontWeight: 600 }}>{j.company_name}</td>
                    <td style={{ padding: 12 }}>{j.job_title}</td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: "1px solid #e5e7eb",
                          fontSize: 12,
                          background: "#f9fafb",
                        }}
                      >
                        {j.status || "—"}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>{prettyDate(j.date_applied || j.created_at)}</td>
                    <td style={{ padding: 12 }}>{daysSince(j.date_applied || j.created_at)}</td>
                    <td style={{ padding: 12 }}>
                      {j.job_url ? (
                        <a href={j.job_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
