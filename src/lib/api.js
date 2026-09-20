const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

/** Builds a query string from an object, skipping empty/undefined values. */
export function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("chemist_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Request failed.");
  return payload;
}

/**
 * Fetches a protected binary endpoint (e.g. a PDF) with the bearer token attached and
 * opens it in a new tab via a blob URL. A plain `window.open(apiUrl)` can't attach an
 * Authorization header, so the backend's auth middleware rejects it — this works around that.
 */
export async function openAuthedFile(path) {
  const token = localStorage.getItem("chemist_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Request failed.");
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const win = window.open(blobUrl, "_blank");
  if (!win) throw new Error("Pop-up blocked — allow pop-ups for this site to view the PDF.");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
