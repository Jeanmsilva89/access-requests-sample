import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
  Title,
  Anchor,
} from "@mantine/core";
import { Link, useParams } from "react-router-dom";
import { getRequest, updateRequestStatus } from "@access-requests/clients";
import { apiBase, type AccessRequest } from "../lib/api";
import { useMockFlag } from "../lib/mockContext";
import { StatusBadge } from "../components/StatusBadge";

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const { noteMock } = useMockFlag();

  const refresh = useCallback(async () => {
    if (!apiBase || !id) {
      setError(!apiBase ? "VITE_API_BASE_URL is not set" : "Missing request id");
      setLoading(false);
      return;
    }
    try {
      const result = await getRequest(apiBase, id);
      setRequest(result.request as AccessRequest);
      noteMock(result.mock);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id, noteMock]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onDecide(status: "approved" | "denied") {
    if (!id) return;
    setActing(true);
    try {
      const result = await updateRequestStatus(apiBase, id, { status });
      setRequest(result.request as AccessRequest);
      noteMock(result.mock);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  if (!request) {
    return (
      <Stack data-testid="request-detail-missing">
        <Title order={2}>Request not found</Title>
        <Text c="red" role="alert">
          {error ?? "Unknown request"}
        </Text>
        <Anchor component={Link} to="/requests">
          Back to requests
        </Anchor>
      </Stack>
    );
  }

  return (
    <Stack gap="md" data-testid="request-detail-page">
      <Group justify="space-between">
        <Title order={2}>{request.title}</Title>
        <span data-testid={`status-${request.id}`}>
          <StatusBadge status={request.status} />
        </span>
      </Group>

      {error ? (
        <Text c="red" role="alert" data-testid="error">
          {error}
        </Text>
      ) : null}

      <Card withBorder padding="lg">
        <Stack gap="xs">
          <Text>
            <Text span fw={600}>
              ID:{" "}
            </Text>
            {request.id}
          </Text>
          <Text>
            <Text span fw={600}>
              Requester:{" "}
            </Text>
            {request.requester}
          </Text>
          <Text>
            <Text span fw={600}>
              Resource:{" "}
            </Text>
            {request.resource}
          </Text>
          <Text>
            <Text span fw={600}>
              Access level:{" "}
            </Text>
            {request.accessLevel}
          </Text>
          <Text>
            <Text span fw={600}>
              Created:{" "}
            </Text>
            {new Date(request.createdAt).toLocaleString()}
          </Text>
          <Text>
            <Text span fw={600}>
              Justification:{" "}
            </Text>
            {request.justification}
          </Text>
        </Stack>
      </Card>

      {request.status === "pending" ? (
        <Group>
          <Button
            color="green"
            data-testid={`approve-${request.id}`}
            loading={acting}
            onClick={() => void onDecide("approved")}
          >
            Approve
          </Button>
          <Button
            color="red"
            variant="light"
            data-testid={`deny-${request.id}`}
            loading={acting}
            onClick={() => void onDecide("denied")}
          >
            Deny
          </Button>
        </Group>
      ) : null}

      <Anchor component={Link} to="/requests">
        ← Back to requests
      </Anchor>
    </Stack>
  );
}
