import {
	Anchor,
	Badge,
	Card,
	Group,
	Loader,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAuditEvents } from "../../../client/src/index.js";
import { type AuditEvent, apiBase } from "../lib/api";
import { useMockFlag } from "../lib/mockContext";

const typeColor: Record<string, string> = {
	created: "blue",
	approved: "green",
	denied: "red",
};

export function AuditPage() {
	const [events, setEvents] = useState<AuditEvent[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const { noteMock } = useMockFlag();

	const refresh = useCallback(async () => {
		if (!apiBase) {
			setError("VITE_API_BASE_URL is not set");
			setLoading(false);
			return;
		}
		try {
			const result = await listAuditEvents(apiBase);
			setEvents(result.events as AuditEvent[]);
			noteMock(result.mock);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [noteMock]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	if (loading) {
		return (
			<Group justify="center" py="xl">
				<Loader />
			</Group>
		);
	}

	return (
		<Stack gap="md" data-testid="audit-page">
			<Title order={2}>Audit Log</Title>
			{error ? (
				<Text c="red" role="alert" data-testid="error">
					{error}
				</Text>
			) : null}

			<Stack gap="sm" data-testid="audit-list">
				{events.map((evt) => (
					<Card
						key={evt.id}
						withBorder
						padding="sm"
						data-testid={`audit-event-${evt.id}`}
					>
						<Group justify="space-between" align="flex-start" wrap="nowrap">
							<Stack gap={4} style={{ minWidth: 0 }}>
								<Group gap="xs">
									<Badge color={typeColor[evt.type] ?? "gray"} variant="light">
										{evt.type}
									</Badge>
									<Text size="sm" c="dimmed">
										{new Date(evt.timestamp).toLocaleString()}
									</Text>
								</Group>
								<Text fw={500}>{evt.message}</Text>
								<Text size="sm" c="dimmed">
									Actor: {evt.actor} · Request:{" "}
									<Anchor
										component={Link}
										to={`/requests/${evt.requestId}`}
										size="sm"
									>
										{evt.requestId}
									</Anchor>
								</Text>
							</Stack>
						</Group>
					</Card>
				))}
				{events.length === 0 ? (
					<Text c="dimmed" data-testid="audit-empty">
						No audit events yet.
					</Text>
				) : null}
			</Stack>
		</Stack>
	);
}
