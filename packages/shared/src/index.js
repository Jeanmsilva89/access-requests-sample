export const MOCK_HEADER = "X-Mock";

/** @param {{ get(name: string): string | null }} headers */
export function isSandboxResponse(headers) {
	return headers.get(MOCK_HEADER) === "true";
}
