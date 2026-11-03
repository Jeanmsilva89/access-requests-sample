export const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || "";

export type AccessRequest = {
  id: string;
  title: string;
  requester: string;
  resource: string;
  accessLevel: string;
  justification: string;
  status: string;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  type: string;
  requestId: string;
  actor: string;
  timestamp: string;
  message: string;
};

export const ACCESS_LEVELS = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "admin", label: "Admin" },
] as const;
