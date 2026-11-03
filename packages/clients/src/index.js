/**
 * Thin fetch client (hey-api generation skipped for this minimal sample).
 * Reads base URL from the caller; never hardcodes mock vs real.
 */

/**
 * @param {string} baseUrl
 * @returns {Promise<{ requests: Array<{ id: string; title: string; requester: string; status: string; createdAt: string }>, mock: boolean }>}
 */
export async function listRequests(baseUrl) {
	const res = await fetch(`${baseUrl.replace(/\/$/, "")}/requests`);
	if (!res.ok) throw new Error(`listRequests failed: ${res.status}`);
	const mock = res.headers.get("X-Mock") === "true";
	const data = await res.json();
	return { requests: data.requests ?? data, mock };
}

/**
 * @param {string} baseUrl
 * @param {{ title: string; requester?: string }} body
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
	const mock = res.headers.get("X-Mock") === "true";
	const data = await res.json();
	return { request: data, mock };
}

/**
 * @param {string} baseUrl
 * @param {string} id
 * @param {{ status: "approved" | "denied" }} body
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
	const mock = res.headers.get("X-Mock") === "true";
	const data = await res.json();
	return { request: data, mock };
}
