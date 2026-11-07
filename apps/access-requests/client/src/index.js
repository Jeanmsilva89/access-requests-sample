import { isSandboxResponse } from "@repo/shared";

/**
 * Thin fetch client (hey-api generation skipped for this minimal sample).
 * Reads base URL from the caller; never hardcodes mock vs real.
 */

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   requester: string;
 *   resource: string;
 *   accessLevel: string;
 *   justification: string;
 *   status: string;
 *   createdAt: string;
 * }} AccessRequest
 */

/**
 * @typedef {{
 *   id: string;
 *   type: "created" | "approved" | "denied" | string;
 *   requestId: string;
 *   actor: string;
 *   timestamp: string;
 *   message: string;
 * }} AuditEvent
 */

/**
 * @param {string} baseUrl
 * @returns {Promise<{ requests: AccessRequest[], mock: boolean }>}
 */
export async function listRequests(baseUrl) {
	const res = await fetch(`${baseUrl.replace(/\/$/, "")}/requests`);
	if (!res.ok) throw new Error(`listRequests failed: ${res.status}`);
	const mock = isSandboxResponse(res.headers);
	const data = await res.json();
	return { requests: data.requests ?? data, mock };
}

/**
 * @param {string} baseUrl
 * @param {string} id
 * @returns {Promise<{ request: AccessRequest, mock: boolean }>}
 */
export async function getRequest(baseUrl, id) {
	const res = await fetch(
		`${baseUrl.replace(/\/$/, "")}/requests/${encodeURIComponent(id)}`,
	);
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`getRequest failed: ${res.status} ${err}`);
	}
	const mock = isSandboxResponse(res.headers);
	const data = await res.json();
	return { request: data, mock };
}

/**
 * @param {string} baseUrl
 * @param {{
 *   title?: string;
 *   requester: string;
 *   resource: string;
 *   accessLevel: string;
 *   justification: string;
 * }} body
 */
export async function createRequest(baseUrl, body) {
	const res = await fetch(`${baseUrl.replace(/\/$/, "")}/requests`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`createRequest failed: ${res.status} ${err}`);
	}
	const mock = isSandboxResponse(res.headers);
	const data = await res.json();
	return { request: data, mock };
}

/**
 * @param {string} baseUrl
 * @param {string} id
 * @param {{ status: "approved" | "denied"; actor?: string }} body
 */
export async function updateRequestStatus(baseUrl, id, body) {
	const res = await fetch(
		`${baseUrl.replace(/\/$/, "")}/requests/${encodeURIComponent(id)}`,
		{
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		},
	);
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`updateRequestStatus failed: ${res.status} ${err}`);
	}
	const mock = isSandboxResponse(res.headers);
	const data = await res.json();
	return { request: data, mock };
}

/**
 * @param {string} baseUrl
 * @returns {Promise<{ events: AuditEvent[], mock: boolean }>}
 */
export async function listAuditEvents(baseUrl) {
	const res = await fetch(`${baseUrl.replace(/\/$/, "")}/audit`);
	if (!res.ok) throw new Error(`listAuditEvents failed: ${res.status}`);
	const mock = isSandboxResponse(res.headers);
	const data = await res.json();
	return { events: data.events ?? data, mock };
}
