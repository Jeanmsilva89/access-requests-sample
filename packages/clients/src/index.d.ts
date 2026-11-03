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

export function listRequests(
	baseUrl: string,
): Promise<{ requests: AccessRequest[]; mock: boolean }>;

export function getRequest(
	baseUrl: string,
	id: string,
): Promise<{ request: AccessRequest; mock: boolean }>;

export function createRequest(
	baseUrl: string,
	body: {
		title?: string;
		requester: string;
		resource: string;
		accessLevel: string;
		justification: string;
	},
): Promise<{ request: AccessRequest; mock: boolean }>;

export function updateRequestStatus(
	baseUrl: string,
	id: string,
	body: { status: "approved" | "denied"; actor?: string },
): Promise<{ request: AccessRequest; mock: boolean }>;

export function listAuditEvents(
	baseUrl: string,
): Promise<{ events: AuditEvent[]; mock: boolean }>;
