export function daysSince(dateStr) {
  // dateStr expected: "YYYY-MM-DD"
  if (!dateStr) return "-";
  const start = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const diffMs = today.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : 0;
}

export function prettyDate(dateStr) {
  if (!dateStr) return "-";
  // keep it simple and readable
  return dateStr;
}
