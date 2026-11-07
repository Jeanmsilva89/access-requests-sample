import { MOCK_HEADER } from "@repo/shared";

import cors from "@fastify/cors";
import Fastify from "fastify";

if (process.env.NODE_ENV === "production") {
	throw new Error("Sandbox mocks must never run in production");
}

const PORT = Number(process.env.PORT || 4010);

const app = Fastify({ logger: true });

await app.register(cors, {
	origin: true,
	methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	exposedHeaders: [MOCK_HEADER],
});

// Always mark responses as mock
app.addHook("onSend", async (_request, reply, payload) => {
	reply.header(MOCK_HEADER, "true");
	return payload;
});

const ACCESS_LEVELS = ["read", "write", "admin"];

const seedRequests = () => [
	{
		id: "req-1",
		title: "Access to analytics dashboard",
		requester: "alice@example.com",
		resource: "analytics-dashboard",
		accessLevel: "read",
		justification: "Need weekly funnel metrics for Q4 planning.",
		status: "pending",
		createdAt: "2026-11-01T10:00:00.000Z",
	},
	{
		id: "req-2",
		title: "Read access to payroll reports",
		requester: "bob@example.com",
		resource: "payroll-reports",
		accessLevel: "read",
		justification: "Finance audit preparation for November close.",
		status: "approved",
		createdAt: "2026-11-02T14:30:00.000Z",
	},
	{
		id: "req-3",
		title: "Admin role for staging",
		requester: "carol@example.com",
		resource: "staging-console",
		accessLevel: "admin",
		justification: "Deploy hotfix to staging environment.",
		status: "denied",
		createdAt: "2026-10-28T09:15:00.000Z",
	},
	{
		id: "req-4",
		title: "Write access to customer CRM",
		requester: "dana@example.com",
		resource: "customer-crm",
		accessLevel: "write",
		justification: "Update account notes during onboarding support.",
		status: "pending",
		createdAt: "2026-11-02T08:00:00.000Z",
	},
	{
		id: "req-5",
		title: "Read access to billing warehouse",
		requester: "erin@example.com",
		resource: "billing-warehouse",
		accessLevel: "read",
		justification: "Investigate invoice discrepancy for enterprise accounts.",
		status: "approved",
		createdAt: "2026-10-30T16:45:00.000Z",
	},
];

const seedAudit = () => [
	{
		id: "evt-1",
		type: "created",
		requestId: "req-3",
		actor: "carol@example.com",
		timestamp: "2026-10-28T09:15:00.000Z",
		message: "Request created: Admin role for staging",
	},
	{
		id: "evt-2",
		type: "denied",
		requestId: "req-3",
		actor: "reviewer@example.com",
		timestamp: "2026-10-28T11:00:00.000Z",
		message: "Request denied: Admin role for staging",
	},
	{
		id: "evt-3",
		type: "created",
		requestId: "req-5",
		actor: "erin@example.com",
		timestamp: "2026-10-30T16:45:00.000Z",
		message: "Request created: Read access to billing warehouse",
	},
	{
		id: "evt-4",
		type: "approved",
		requestId: "req-5",
		actor: "reviewer@example.com",
		timestamp: "2026-10-31T09:00:00.000Z",
		message: "Request approved: Read access to billing warehouse",
	},
	{
		id: "evt-5",
		type: "created",
		requestId: "req-1",
		actor: "alice@example.com",
		timestamp: "2026-11-01T10:00:00.000Z",
		message: "Request created: Access to analytics dashboard",
	},
	{
		id: "evt-6",
		type: "created",
		requestId: "req-4",
		actor: "dana@example.com",
		timestamp: "2026-11-02T08:00:00.000Z",
		message: "Request created: Write access to customer CRM",
	},
	{
		id: "evt-7",
		type: "created",
		requestId: "req-2",
		actor: "bob@example.com",
		timestamp: "2026-11-02T14:30:00.000Z",
		message: "Request created: Read access to payroll reports",
	},
	{
		id: "evt-8",
		type: "approved",
		requestId: "req-2",
		actor: "reviewer@example.com",
		timestamp: "2026-11-02T15:00:00.000Z",
		message: "Request approved: Read access to payroll reports",
	},
];

/** @type {ReturnType<typeof seedRequests>} */
const store = seedRequests();
/** @type {ReturnType<typeof seedAudit>} */
const audit = seedAudit();

let nextId = 6;
let nextEventId = 9;

function resetStore() {
	store.length = 0;
	store.push(...seedRequests());
	audit.length = 0;
	audit.push(...seedAudit());
	nextId = 6;
	nextEventId = 9;
}

function pushAudit(event) {
	audit.unshift(event);
}

app.get("/health", async () => ({ ok: true }));

app.get("/requests", async () => ({ requests: store }));

app.get("/requests/:id", async (request, reply) => {
	const { id } = /** @type {{ id: string }} */ (request.params);
	const item = store.find((r) => r.id === id);
	if (!item) {
		return reply.code(404).send({ error: "request not found" });
	}
	return item;
});

app.post("/requests", async (request, reply) => {
	const body =
		/** @type {{ title?: string; requester?: string; resource?: string; accessLevel?: string; justification?: string }} */ (
			request.body || {}
		);

	const requester =
		typeof body.requester === "string" && body.requester.trim()
			? body.requester.trim()
			: "";
	const resource =
		typeof body.resource === "string" && body.resource.trim()
			? body.resource.trim()
			: "";
	const accessLevel =
		typeof body.accessLevel === "string"
			? body.accessLevel.trim().toLowerCase()
			: "";
	const justification =
		typeof body.justification === "string" && body.justification.trim()
			? body.justification.trim()
			: "";

	const titleFromBody =
		typeof body.title === "string" && body.title.trim()
			? body.title.trim()
			: "";

	// Prefer structured fields; fall back to legacy title-only create for compatibility
	if (
		!titleFromBody &&
		(!requester || !resource || !accessLevel || !justification)
	) {
		return reply.code(400).send({
			error:
				"requester, resource, accessLevel, and justification are required (or provide title for legacy create)",
		});
	}

	if (accessLevel && !ACCESS_LEVELS.includes(accessLevel)) {
		return reply.code(400).send({
			error: `accessLevel must be one of: ${ACCESS_LEVELS.join(", ")}`,
		});
	}

	const title =
		titleFromBody ||
		`${accessLevel.charAt(0).toUpperCase()}${accessLevel.slice(1)} access to ${resource}`;

	const item = {
		id: `req-${nextId++}`,
		title,
		requester: requester || "anonymous@example.com",
		resource: resource || "unspecified",
		accessLevel: accessLevel || "read",
		justification: justification || title,
		status: "pending",
		createdAt: new Date().toISOString(),
	};
	store.unshift(item);

	pushAudit({
		id: `evt-${nextEventId++}`,
		type: "created",
		requestId: item.id,
		actor: item.requester,
		timestamp: item.createdAt,
		message: `Request created: ${item.title}`,
	});

	return reply.code(201).send(item);
});

app.patch("/requests/:id", async (request, reply) => {
	const { id } = /** @type {{ id: string }} */ (request.params);
	const body = /** @type {{ status?: string; actor?: string }} */ (
		request.body || {}
	);
	const status =
		typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
	const actor =
		typeof body.actor === "string" && body.actor.trim()
			? body.actor.trim()
			: "reviewer@example.com";

	if (status !== "approved" && status !== "denied") {
		return reply
			.code(400)
			.send({ error: "status must be 'approved' or 'denied'" });
	}

	const item = store.find((r) => r.id === id);
	if (!item) {
		return reply.code(404).send({ error: "request not found" });
	}
	if (item.status !== "pending") {
		return reply.code(409).send({ error: `request is already ${item.status}` });
	}

	item.status = status;
	const timestamp = new Date().toISOString();
	pushAudit({
		id: `evt-${nextEventId++}`,
		type: status,
		requestId: item.id,
		actor,
		timestamp,
		message: `Request ${status}: ${item.title}`,
	});

	return item;
});

app.get("/audit", async () => {
	const sorted = [...audit].sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);
	return { events: sorted };
});

/** Test-only deterministic reset (also aliased as /reset). */
app.post("/__reset", async () => {
	resetStore();
	return { ok: true, count: store.length, auditCount: audit.length };
});

app.post("/reset", async () => {
	resetStore();
	return { ok: true, count: store.length, auditCount: audit.length };
});

await app.listen({ port: PORT, host: "0.0.0.0" });
console.log(`Mock server listening on http://localhost:${PORT}`);
