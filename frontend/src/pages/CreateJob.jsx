import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { clearTokens } from "../lib/api";

function todayInput() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CreateJob() {
  const nav = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [locationType, setLocationType] = useState("remote");
  const [status, setStatus] = useState("applied");
  const [referral, setReferral] = useState(false);
  const [dateApplied, setDateApplied] = useState(todayInput());
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return companyName.trim() && jobTitle.trim() && jobUrl.trim();
  }, [companyName, jobTitle, jobUrl]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!canSubmit) {
      setErr("Please fill Company, Job Title, and Job URL.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        company_name: companyName.trim(),
        job_title: jobTitle.trim(),
        job_url: jobUrl.trim(),
        location_type: locationType,
        status,
        referral,
        notes: notes.trim() || "",
        date_applied: dateApplied || null,
        follow_up_date: followUpDate || null,
      };

      // API base already includes /api, so this hits: /api/jobs/
      await api.post("/jobs/", payload);

      // go back to dashboard
      nav("/dashboard");
    } catch (e2) {
      const statusCode = e2?.response?.status;

      if (statusCode === 401) {
        clearTokens();
        nav("/login");
        return;
      }

      const backendMsg =
        e2?.response?.data?.detail ||
        (typeof e2?.response?.data === "string" ? e2.response.data : "") ||
        "";

      // Handle DRF field errors nicely
      const fieldErrors = e2?.response?.data;
      let extra = "";
      if (fieldErrors && typeof fieldErrors === "object") {
        const keys = Object.keys(fieldErrors);
        if (keys.length) {
          extra = keys
            .map((k) => `${k}: ${Array.isArray(fieldErrors[k]) ? fieldErrors[k].join(", ") : String(fieldErrors[k])}`)
            .join(" | ");
        }
      }

      setErr(backendMsg || extra || e2?.message || "Failed to create job.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    nav("/dashboard");
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Create Job</h2>
          <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
            Add a new job application to your tracker.
          </div>
        </div>

        <button
          onClick={cancel}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "white",
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>

      {err ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#991b1b",
            borderRadius: 12,
          }}
        >
          {err}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 14,
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 16,
          background: "white",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Company *</div>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Google"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginTop: 6,
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Job Title *</div>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Software Engineer"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginTop: 6,
              }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Job URL *</div>
            <input
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://company.com/jobs/123"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginTop: 6,
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Location</div>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "white",
                marginTop: 6,
              }}
            >
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Status</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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

          <div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Date Applied</div>
            <input
              type="date"
              value={dateApplied}
              onChange={(e) => setDateApplied(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginTop: 6,
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Follow-up Date</div>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginTop: 6,
              }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <input type="checkbox" checked={referral} onChange={(e) => setReferral(e.target.checked)} />
              <span style={{ fontSize: 13 }}>Referral used</span>
            </label>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Recruiter name, next steps, etc."
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
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={cancel}
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
            type="submit"
            disabled={!canSubmit || saving}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "white",
              cursor: !canSubmit || saving ? "not-allowed" : "pointer",
              opacity: !canSubmit || saving ? 0.7 : 1,
            }}
          >
            {saving ? "Creating..." : "Create Job"}
          </button>
        </div>
      </form>
    </div>
  );
}