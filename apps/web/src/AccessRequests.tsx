import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createRequest,
  listRequests,
  updateRequestStatus,
} from "@access-requests/clients";

type RequestItem = {
  id: string;
  title: string;
  requester: string;
  status: string;
  createdAt: string;
};

const apiBase = import.meta.env.VITE_API_BASE_URL as string;

export function AccessRequests() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [title, setTitle] = useState("");
  const [requester, setRequester] = useState("jean@example.com");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!apiBase) {
      setError("VITE_API_BASE_URL is not set");
      return;
    }
    try {
      const result = await listRequests(apiBase);
      setRequests(result.requests);
      setIsMock(result.mock);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const result = await createRequest(apiBase, {
        title: title.trim(),
        requester: requester.trim() || undefined,
      });
      setIsMock(result.mock);
      setTitle("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function onDecide(id: string, status: "approved" | "denied") {
    setActingId(id);
    try {
      const result = await updateRequestStatus(apiBase, id, { status });
      setIsMock(result.mock);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: result.request.status } : r)),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="app">
      {isMock ? (
        <div className="banner" data-testid="sandbox-banner">
          Running against mocks (sandbox)
        </div>
      ) : null}

      <h1>Access Requests</h1>

      <form className="form" onSubmit={onSubmit} data-testid="create-form">
        <input
          data-testid="title-input"
          placeholder="What access do you need?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Request title"
        />
        <input
          data-testid="requester-input"
          placeholder="Requester email"
          value={requester}
          onChange={(e) => setRequester(e.target.value)}
          aria-label="Requester email"
        />
        <button type="submit" disabled={loading || !title.trim()} data-testid="submit-btn">
          {loading ? "Submitting…" : "Create request"}
        </button>
      </form>

      {error ? (
        <p className="error" data-testid="error" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="list" data-testid="requests-list">
        {requests.map((r) => (
          <li key={r.id} className="card" data-testid={`request-${r.id}`}>
            <div className="title">
              {r.title}
              <span className={`status ${r.status}`} data-testid={`status-${r.id}`}>
                {r.status}
              </span>
            </div>
            <div className="meta">
              {r.requester} · {new Date(r.createdAt).toLocaleString()}
            </div>
            {r.status === "pending" ? (
              <div className="actions">
                <button
                  type="button"
                  className="approve"
                  data-testid={`approve-${r.id}`}
                  disabled={actingId === r.id}
                  onClick={() => void onDecide(r.id, "approved")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="deny"
                  data-testid={`deny-${r.id}`}
                  disabled={actingId === r.id}
                  onClick={() => void onDecide(r.id, "denied")}
                >
                  Deny
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
