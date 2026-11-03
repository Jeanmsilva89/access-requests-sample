import Fastify from "fastify";
import cors from "@fastify/cors";

const PORT = Number(process.env.PORT || 4010);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  exposedHeaders: ["X-Mock"],
});

// Always mark responses as mock
app.addHook("onSend", async (_request, reply, payload) => {
  reply.header("X-Mock", "true");
  return payload;
});

const seed = () => [
  {
    id: "req-1",
    title: "Access to analytics dashboard",
    requester: "alice@example.com",
    status: "pending",
    createdAt: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "req-2",
    title: "Read access to payroll reports",
    requester: "bob@example.com",
    status: "approved",
    createdAt: "2026-11-02T14:30:00.000Z",
  },
  {
    id: "req-3",
    title: "Admin role for staging",
    requester: "carol@example.com",
    status: "denied",
    createdAt: "2026-10-28T09:15:00.000Z",
  },
];

/** @type {{ id: string; title: string; requester: string; status: string; createdAt: string }[]} */
const store = seed();

let nextId = 4;

function resetStore() {
  store.length = 0;
  store.push(...seed());
  nextId = 4;
}

app.get("/health", async () => ({ ok: true }));

app.get("/requests", async () => ({ requests: store }));

app.post("/requests", async (request, reply) => {
  const body = /** @type {{ title?: string; requester?: string }} */ (request.body || {});
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const requester =
    typeof body.requester === "string" && body.requester.trim()
      ? body.requester.trim()
      : "anonymous@example.com";

  if (!title) {
    return reply.code(400).send({ error: "title is required" });
  }

  const item = {
    id: `req-${nextId++}`,
    title,
    requester,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store.unshift(item);
  return reply.code(201).send(item);
});

app.patch("/requests/:id", async (request, reply) => {
  const { id } = /** @type {{ id: string }} */ (request.params);
  const body = /** @type {{ status?: string }} */ (request.body || {});
  const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";

  if (status !== "approved" && status !== "denied") {
    return reply.code(400).send({ error: "status must be 'approved' or 'denied'" });
  }

  const item = store.find((r) => r.id === id);
  if (!item) {
    return reply.code(404).send({ error: "request not found" });
  }
  if (item.status !== "pending") {
    return reply.code(409).send({ error: `request is already ${item.status}` });
  }

  item.status = status;
  return item;
});

/** Test-only deterministic reset (also aliased as /reset). */
app.post("/__reset", async () => {
  resetStore();
  return { ok: true, count: store.length };
});

app.post("/reset", async () => {
  resetStore();
  return { ok: true, count: store.length };
});

await app.listen({ port: PORT, host: "0.0.0.0" });
console.log(`Mock server listening on http://localhost:${PORT}`);
