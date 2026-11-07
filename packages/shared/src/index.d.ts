export declare const MOCK_HEADER: "X-Mock";
export declare function isSandboxResponse(
	headers: Pick<Headers, "get">,
): boolean;
