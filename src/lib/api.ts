import { toast } from "sonner";

export const STAFF_TOKEN_KEY = "tuitionos.access-token";
export const PARENT_TOKEN_KEY = "tuitionos.parent-token";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getStaffToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STAFF_TOKEN_KEY);
}

export function setStaffToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(STAFF_TOKEN_KEY, token);
  else window.localStorage.removeItem(STAFF_TOKEN_KEY);
}

export function getParentToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PARENT_TOKEN_KEY);
}

export function setParentToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(PARENT_TOKEN_KEY, token);
  else window.localStorage.removeItem(PARENT_TOKEN_KEY);
}

function apiBase() {
  const configured = String(import.meta.env["VITE_API_URL"] ?? "").replace(/\/$/, "");
  if (typeof window === "undefined") {
    return configured || "http://localhost:4100";
  }
  // Same-origin in the browser so Vite can proxy /v1 and skip CORS preflight.
  if (!configured || /:(4100)\b/.test(configured)) return "";
  return configured;
}

function defaultAuth(path: string): "staff" | "parent" | "none" {
  if (path.startsWith("/v1/parent/auth/me") || path.startsWith("/v1/parent/auth/logout")) return "parent";
  if (path.startsWith("/v1/parent/auth")) return "none";
  if (path === "/v1/auth/me" || path === "/v1/auth/logout") return "staff";
  if (path.startsWith("/v1/auth")) return "none";
  // Portal only: `/v1/parent/...` — do not match staff `/v1/parents`.
  if (path.startsWith("/v1/parent/")) return "parent";
  return "staff";
}

function buildQuery(query?: Record<string, string | number | boolean | undefined | null>) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function api<T>(
  path: string,
  opts: RequestInit & {
    auth?: "staff" | "parent" | "none";
    query?: Record<string, string | number | boolean | undefined | null>;
  } = {},
): Promise<{ data: T; meta?: unknown }> {
  const { auth = defaultAuth(path), query, headers, ...init } = opts;
  const token = auth === "staff" ? getStaffToken() : auth === "parent" ? getParentToken() : null;
  const res = await fetch(`${apiBase()}${path}${buildQuery(query)}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    meta?: unknown;
    error?: { code?: string; message?: string; fields?: Record<string, string> };
  };
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.error?.code ?? "ERROR",
      json.error?.message ?? `Request failed (${res.status})`,
      json.error?.fields,
    );
  }
  return { data: json.data as T, meta: json.meta };
}

export function toastError(err: unknown, fallback = "Something went wrong") {
  const message = err instanceof ApiError ? err.message : fallback;
  toast.error(message);
}
