import {
	Button,
	Select,
	Stack,
	Text,
	TextInput,
	Textarea,
	Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest } from "../../../client/src/index.js";
import { ACCESS_LEVELS, apiBase } from "../lib/api";
import { useMockFlag } from "../lib/mockContext";

type FormErrors = Partial<
	Record<"requester" | "resource" | "accessLevel" | "justification", string>
>;

export function NewRequestPage() {
	const navigate = useNavigate();
	const { noteMock } = useMockFlag();
	const [requester, setRequester] = useState("jean@example.com");
	const [resource, setResource] = useState("");
	const [accessLevel, setAccessLevel] = useState<string | null>(null);
	const [justification, setJustification] = useState("");
	const [errors, setErrors] = useState<FormErrors>({});
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	function validate(): FormErrors {
		const next: FormErrors = {};
		if (!requester.trim()) next.requester = "Requester is required";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requester.trim())) {
			next.requester = "Enter a valid email";
		}
		if (!resource.trim()) next.resource = "Resource is required";
		if (!accessLevel) next.accessLevel = "Access level is required";
		if (!justification.trim()) next.justification = "Justification is required";
		else if (justification.trim().length < 10) {
			next.justification = "Justification must be at least 10 characters";
		}
		return next;
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		const next = validate();
		setErrors(next);
		if (Object.keys(next).length > 0) return;

		if (!accessLevel) return;

		setSubmitting(true);
		setSubmitError(null);
		try {
			const result = await createRequest(apiBase, {
				requester: requester.trim(),
				resource: resource.trim(),
				accessLevel,
				justification: justification.trim(),
			});
			noteMock(result.mock);
			notifications.show({
				title: "Request created",
				message: result.request.title,
				color: "green",
				autoClose: 4000,
			});
			navigate("/requests");
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : String(err));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Stack gap="md" maw={560} data-testid="new-request-page">
			<Title order={2}>New Request</Title>
			<form onSubmit={onSubmit} data-testid="create-form" noValidate>
				<Stack gap="sm">
					<TextInput
						label="Requester"
						placeholder="you@example.com"
						value={requester}
						onChange={(e) => setRequester(e.currentTarget.value)}
						error={errors.requester}
						data-testid="requester-input"
						required
					/>
					<TextInput
						label="Resource"
						placeholder="e.g. analytics-dashboard"
						value={resource}
						onChange={(e) => setResource(e.currentTarget.value)}
						error={errors.resource}
						data-testid="resource-input"
						required
					/>
					<Select
						label="Access level"
						placeholder="Select level"
						data={[...ACCESS_LEVELS]}
						value={accessLevel}
						onChange={setAccessLevel}
						error={errors.accessLevel}
						data-testid="access-level-select"
						required
					/>
					<Textarea
						label="Justification"
						placeholder="Why do you need this access?"
						minRows={3}
						value={justification}
						onChange={(e) => setJustification(e.currentTarget.value)}
						error={errors.justification}
						data-testid="justification-input"
						required
					/>
					{submitError ? (
						<Text c="red" role="alert" data-testid="error">
							{submitError}
						</Text>
					) : null}
					<Button type="submit" loading={submitting} data-testid="submit-btn">
						Create request
					</Button>
				</Stack>
			</form>
		</Stack>
	);
}
