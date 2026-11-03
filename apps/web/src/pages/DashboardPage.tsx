import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Group, Loader, SimpleGrid, Stack, Text, Title, Anchor, Badge } from "@mantine/core";
import { Link } from "react-router-dom";
import { listRequests } from "@access-requests/clients";
import { apiBase, type AccessRequest } from "../lib/api";
import { useMockFlag } from "../lib/mockContext";
import { StatusBadge } from "../components/StatusBadge";

export function DashboardPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
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
      const result = await listRequests(apiBase);
      setRequests(result.requests as AccessRequest[]);
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

  const counts = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const denied = requests.filter((r) => r.status === "denied").length;
    return { total, pending, approved, denied };
  }, [requests]);

  const recent = useMemo(
    () =>
      [...requests]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [requests],
  );

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader data-testid="dashboard-loading" />
      </Group>
    );
  }

  return (
    <Stack gap="lg" data-testid="dashboard-page">
      <Title order={2}>Dashboard</Title>
      {error ? (
        <Text c="red" role="alert" data-testid="error">
          {error}
        </Text>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} data-testid="stat-cards">
        <Card withBorder padding="lg" data-testid="stat-total">
          <Text size="sm" c="dimmed">
            Total
          </Text>
          <Text fw={700} size="xl">
            {counts.total}
          </Text>
        </Card>
        <Card withBorder padding="lg" data-testid="stat-pending">
          <Text size="sm" c="dimmed">
            Pending
          </Text>
          <Text fw={700} size="xl" c="yellow.8">
            {counts.pending}
          </Text>
        </Card>
        <Card withBorder padding="lg" data-testid="stat-approved">
          <Text size="sm" c="dimmed">
            Approved
          </Text>
          <Text fw={700} size="xl" c="green.7">
            {counts.approved}
          </Text>
        </Card>
        <Card withBorder padding="lg" data-testid="stat-denied">
          <Text size="sm" c="dimmed">
            Denied
          </Text>
          <Text fw={700} size="xl" c="red.7">
            {counts.denied}
          </Text>
        </Card>
      </SimpleGrid>

      <Stack gap="sm" data-testid="recent-requests">
        <Group justify="space-between">
          <Title order={4}>Recent requests</Title>
          <Anchor component={Link} to="/requests" size="sm">
            View all
          </Anchor>
        </Group>
        {recent.map((r) => (
          <Card key={r.id} withBorder padding="sm" data-testid={`recent-${r.id}`}>
            <Group justify="space-between" wrap="nowrap">
              <Stack gap={2} style={{ minWidth: 0 }}>
                <Anchor component={Link} to={`/requests/${r.id}`} fw={600} lineClamp={1}>
                  {r.title}
                </Anchor>
                <Text size="sm" c="dimmed" lineClamp={1}>
                  {r.requester} · {new Date(r.createdAt).toLocaleString()}
                </Text>
              </Stack>
              <StatusBadge status={r.status} />
            </Group>
          </Card>
        ))}
        {recent.length === 0 ? (
          <Text c="dimmed" size="sm">
            No requests yet.
          </Text>
        ) : null}
      </Stack>
    </Stack>
  );
}
