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

function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function classifyFollowUp(followUpDateStr) {
  if (!followUpDateStr) return "none";
  const today = startOfDay(new Date());
  const f = startOfDay(new Date(followUpDateStr));
  if (Number.isNaN(f.getTime())) return "none";

  const diffDays = Math.floor((f - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "due_soon";
  return "later";
}

function FollowUpBadge({ followUpDate }) {
  const cls = classifyFollowUp(followUpDate);

  if (cls === "none") return null;

  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#111827",
    whiteSpace: "nowrap",
  };

  if (cls === "overdue") {
    return (
      <span style={{ ...base, background: "#fff1f2", border: "1px solid #fecaca", color: "#991b1b" }}>
        ⛔ Overdue
      </span>
    );
  }

  if (cls === "due_soon") {
    return (
      <span style={{ ...base, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}>
        ⚠️ Due soon
      </span>
    );
  }

  return (
    <span style={base}>
      📅 Scheduled
    </span>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [err, setErr] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all"); // ✅ NEW

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editErr, setEditErr] = useState("");

  const JOBS_LIST_PATH = import.meta.env.VITE_JOBS_LIST_PATH || "/jobs/";
  const jobDetailPath = (id) => `/jobs/${id}/`;

  function logout() {
    clearTokens();
    window.location.href = "/login";
  }

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
      if (e?.status === 401) {
        clearTokens();
        window.location.href = "/login";
        return;
      }
      if (!silent) setErr(e?.message || "Failed to load jobs.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs({ silent: false });

    const id = setInterval(() => {
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

    if (followUpFilter !== "all") {
      list = list.filter((j) => {
        const cls = classifyFollowUp(j.follow_up_date);
        if (followUpFilter === "overdue") return cls === "overdue";
        if (followUpFilter === "due_soon") return cls === "due_soon";
        if (followUpFilter === "none") return cls === "none";
        return true;
      });
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

    // Sorting priority:
    // 1) overdue first
    // 2) due soon
    // 3) latest applied
    list = [...list].sort((a, b) => {
      const ra = classifyFollowUp(a.follow_up_date);
      const rb = classifyFollowUp(b.follow_up_date);

      const rank = (r) => (r === "overdue" ? 0 : r === "due_soon" ? 1 : r === "later" ? 2 : 3);

      const pa = rank(ra);
      const pb = rank(rb);
      if (pa !== pb) return pa - pb;

      const da = new Date(a.date_applied || a.created_at || 0).getTime();
      const db = new Date(b.date_applied || b.created_at || 0).getTime();
      return db - da;
    });

    return list;
  }, [jobs, query, statusFilter, followUpFilter]);

  function openEdit(job) {
    setEditErr("");
    setEditingJob({
      ...job,
      date_applied_input: toDateInputValue(job.date_applied || job.created_at),
      follow_up_date_input: toDateInputValue(job.follow_up_date),
      notes_input: job.notes || "",
      referral_input: !!job.referral,
      status_input: job.status || "applied",
    });
    setIsEditOpen(true);
  }

  function closeEdit() {
    if (saving) return;
    setIsEditOpen(false);
    setEditingJob(null);
    setEditErr("");
  }

  async function saveEdit() {
    if (!editingJob?.id) {
      setEditErr("This job has no id. Backend must return an id to edit.");
      return;
    }

    setSaving(true);
    setEditErr("");

    const payload = {
      status: editingJob.status_input,
      referral: editingJob.referral_input,
      notes: editingJob.notes_input,
      date_applied: editingJob.date_applied_input || null,
      follow_up_date: editingJob.follow_up_date_input || null,
    };

    try {
      const updated = await api.patch(jobDetailPath(editingJob.id), payload);
      setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? { ...j, ...updated } : j)));
      setLastUpdated(new Date());
      setIsEditOpen(false);
      setEditingJob(null);
    } catch (e) {
      if (e?.status === 401) {
        clearTokens();
        window.location.href = "/login";
        return;
      }
      setEditErr(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const stats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let none = 0;

    for (const j of jobs) {
      const cls = classifyFollowUp(j.follow_up_date);
      if (cls === "overdue") overdue += 1;
      else if (cls === "due_soon") dueSoon += 1;
      else if (cls === "none") none += 1;
    }

    return { overdue, dueSoon, none, total: jobs.length };
  }, [jobs]);

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

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Total: <b style={{ color: "#111827" }}>{stats.total}</b>
            </span>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Overdue: <b style={{ color: "#991b1b" }}>{stats.overdue}</b>
            </span>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Due soon: <b style={{ color: "#92400e" }}>{stats.dueSoon}</b>
            </span>
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

          <select
            value={followUpFilter}
            onChange={(e) => setFollowUpFilter(e.target.value)}
            style={{
              width: 180,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "white",
            }}
          >
            <option value="all">All Follow-up</option>
            <option value="overdue">Overdue</option>
            <option value="due_soon">Due soon (≤ 3 days)</option>
            <option value="none">No follow-up</option>
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

          <button
            onClick={logout}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "white",
              color: "#111827",
              cursor: "pointer",
            }}
          >
            Logout
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
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 13, color: "#6b7280" }}>
                <th style={{ padding: 12 }}>Company</th>
                <th style={{ padding: 12 }}>Title</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Applied</th>
                <th style={{ padding: 12 }}>Follow-up</th>
                <th style={{ padding: 12 }}>Flag</th>
                <th style={{ padding: 12 }}>Days</th>
                <th style={{ padding: 12 }}>Link</th>
                <th style={{ padding: 12 }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((j) => (
                <tr key={j.id || j.job_url} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{j.company_name}</td>
                  <td style={{ padding: 12 }}>{j.job_title}</td>
                  <td style={{ padding: 12 }}>{j.status || "—"}</td>
                  <td style={{ padding: 12 }}>{prettyDate(j.date_applied || j.created_at)}</td>
                  <td style={{ padding: 12 }}>{prettyDate(j.follow_up_date)}</td>
                  <td style={{ padding: 12 }}>
                    <FollowUpBadge followUpDate={j.follow_up_date} />
                  </td>
                  <td style={{ padding: 12 }}>{daysSince(j.date_applied || j.created_at)}</td>
                  <td style={{ padding: 12 }}>
                    {j.job_url ? (
                      <a href={j.job_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                        Open
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => openEdit(j)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        background: "white",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && editingJob ? (
        <div
          onClick={closeEdit}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              background: "white",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>Edit Job</h3>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
                  {editingJob.company_name} — {editingJob.job_title}
                </div>
              </div>
              <button
                onClick={closeEdit}
                disabled={saving}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                Close
              </button>
            </div>

            {editErr ? (
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
                {editErr}
              </div>
            ) : null}

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Status</div>
              <select
                value={editingJob.status_input}
                onChange={(e) => setEditingJob((p) => ({ ...p, status_input: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  marginTop: 6,
                }}
              >
                <option value="in_progress">In Progress</option>
                <option value="applied">Applied</option>
                <option value="ghosted">Ghosted</option>
                <option value="rejected">Rejected</option>
                <option value="accepted">Accepted</option>
              </select>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Date applied</div>
              <input
                type="date"
                value={editingJob.date_applied_input}
                onChange={(e) => setEditingJob((p) => ({ ...p, date_applied_input: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  marginTop: 6,
                }}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Follow-up date</div>
              <input
                type="date"
                value={editingJob.follow_up_date_input}
                onChange={(e) => setEditingJob((p) => ({ ...p, follow_up_date_input: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  marginTop: 6,
                }}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={editingJob.referral_input}
                  onChange={(e) => setEditingJob((p) => ({ ...p, referral_input: e.target.checked }))}
                />
                <span style={{ fontSize: 13 }}>Referral used</span>
              </label>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Notes</div>
              <textarea
                value={editingJob.notes_input}
                onChange={(e) => setEditingJob((p) => ({ ...p, notes_input: e.target.value }))}
                rows={4}
                placeholder="Add notes (recruiter name, follow-up date, etc.)"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  marginTop: 6,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
              <button
                onClick={closeEdit}
                disabled={saving}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                disabled={saving}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#111827",
                  color: "white",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
