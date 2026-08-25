const AUDIT_KEY = "recipe-management-audit";

export function getAuditLogs() {
  const saved = localStorage.getItem(AUDIT_KEY);

  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function addAuditLog({
  user = "Chef Ahmed",
  module,
  action,
  details,
}) {
  const now = new Date();

  const log = {
    id: `${Date.now()}-${Math.random()}`,
    createdAt: now.toISOString(),

    date: now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),

    time: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),

    user,
    module,
    action,
    details,
  };

  const logs = getAuditLogs();

  const updatedLogs = [
    log,
    ...logs,
  ];

  localStorage.setItem(
    AUDIT_KEY,
    JSON.stringify(updatedLogs)
  );

  window.dispatchEvent(
    new Event("audit-updated")
  );

  return log;
}

export function clearAuditLogs() {
  localStorage.removeItem(AUDIT_KEY);

  window.dispatchEvent(
    new Event("audit-updated")
  );
}