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

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [err, setErr] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

<<<<<<< HEAD
=======
  // Edit modal state
>>>>>>> 2a3caf5 (Milestone 8: Edit job modal (status, notes, referral, date applied))
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editErr, setEditErr] = useState("");

<<<<<<< HEAD
=======
  // Your existing endpoint config
>>>>>>> 2a3caf5 (Milestone 8: Edit job modal (status, notes, referral, date applied))
  const JOBS_LIST_PATH = import.meta.env.VITE_JOBS_LIST_PATH || "/jobs/";
  const jobDetailPath = (id) => `/jobs/${id}/`;

  function logout() {
    clearTokens();
    window.location.href = "/login";
  }

  // ✅ We assume a standard REST endpoint: PATCH /api/jobs/<id>/
  // If your backend path differs, change ONLY this builder.
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
<<<<<<< HEAD
      fetchJobs({ silent: true });
=======
      fetchJobs({ silent: true }); // background polling
>>>>>>> 2a3caf5 (Milestone 8: Edit job modal (status, notes, referral, date applied))
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

  function openEdit(job) {
    setEditErr("");
    setEditingJob({
      ...job,
<<<<<<< HEAD
      date_applied_input: toDateInputValue(job.date_applied || job.created_at),
      follow_up_date_input: toDateInputValue(job.follow_up_date),
=======
      // Normalize fields for inputs
      date_applied_input: toDateInputValue(job.date_applied || job.created_at),
>>>>>>> 2a3caf5 (Milestone 8: Edit job modal (status, notes, referral, date applied))
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
<<<<<<< HEAD
      follow_up_date: editingJob.follow_up_date_input || null,
=======
>>>>>>> 2a3caf5 (Milestone 8: Edit job modal (status, notes, referral, date applied))
    };

    try {
      const updated = await api.patch(jobDetailPath(editingJob.id), payload);

<<<<<<< HEAD
=======
      // Update local list immediately (optimistic UI)
>>>>>>> 2a3caf5 (Milestone 8: Edit job modal (status, notes, referral, date applied))
      setJobs((prev) =>
        prev.map((j) => (j.id === editingJob.id ? { ...j, ...updated } : j))
      );

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

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      {/* Header */}
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

      {/* Main error */}
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

      {/* Table */}
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
                  <th style={{ padding: 12 }}>Follow-up</th>
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
                    <td style={{ padding: 12 }}>{daysSince(j.date_applied || j.created_at)}</td>
                    <td style={{ padding: 12 }}>
                      {j.job_url ? (
<<<<<<< HEAD
                        <a href={j.job_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
=======
                        <a
                          href={j.job_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#2563eb", textDecoration: "none" }}
                        >
>>>>>>> 2a3caf5 (Milestone 8: Edit job modal (status, notes, referral, date applied))
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
        )}
      </div>

<<<<<<< HEAD
=======
      {/* Edit Modal */}
>>>>>>> 2a3caf5 (Milestone 8: Edit job modal (status, notes, referral, date applied))
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
<<<<<<< HEAD
              <div style={{ fontSize: 12, color: "#6b7280" }}>Follow-up date</div>
              <input
                type="date"
                value={editingJob.follow_up_date_input}
                onChange={(e) =>
                  setEditingJob((p) => ({ ...p, follow_up_date_input: e.target.value }))
=======
              <div style={{ fontSize: 12, color: "#6b7280" }}>Status</div>
              <select
                value={editingJob.status_input}
                onChange={(e) =>
                  setEditingJob((p) => ({ ...p, status_input: e.target.value }))
                }
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
                onChange={(e) =>
                  setEditingJob((p) => ({
                    ...p,
                    date_applied_input: e.target.value,
                  }))
>>>>>>> 2a3caf5 (Milestone 8: Edit job modal (status, notes, referral, date applied))
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  marginTop: 6,
                }}
              />
            </div>

<<<<<<< HEAD
=======
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={editingJob.referral_input}
                  onChange={(e) =>
                    setEditingJob((p) => ({
                      ...p,
                      referral_input: e.target.checked,
                    }))
                  }
                />
                <span style={{ fontSize: 13 }}>Referral used</span>
              </label>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Notes</div>
              <textarea
                value={editingJob.notes_input}
                onChange={(e) =>
                  setEditingJob((p) => ({ ...p, notes_input: e.target.value }))
                }
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

>>>>>>> 2a3caf5 (Milestone 8: Edit job modal (status, notes, referral, date applied))
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
