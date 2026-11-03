export type AccessRequest = {
	id: string;
	title: string;
	requester: string;
	status: string;
	createdAt: string;
};

export function listRequests(
	baseUrl: string,
): Promise<{ requests: AccessRequest[]; mock: boolean }>;

export function createRequest(
	baseUrl: string,
	body: { title: string; requester?: string },
): Promise<{ request: AccessRequest; mock: boolean }>;

export function updateRequestStatus(
	baseUrl: string,
	id: string,
	body: { status: "approved" | "denied" },
): Promise<{ request: AccessRequest; mock: boolean }>;
