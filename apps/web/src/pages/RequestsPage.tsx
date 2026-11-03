import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Anchor,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { listRequests, updateRequestStatus } from "@access-requests/clients";
import { apiBase, type AccessRequest } from "../lib/api";
import { useMockFlag } from "../lib/mockContext";
import { StatusBadge } from "../components/StatusBadge";

export function RequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>("all");
  const [search, setSearch] = useState("");
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter && statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.requester.toLowerCase().includes(q) ||
        r.resource.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [requests, search, statusFilter]);

  async function onDecide(id: string, status: "approved" | "denied") {
    setActingId(id);
    try {
      const result = await updateRequestStatus(apiBase, id, { status });
      noteMock(result.mock);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...(result.request as AccessRequest) } : r)),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  }

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Stack gap="md" data-testid="requests-page">
      <Group justify="space-between">
        <Title order={2}>Requests</Title>
        <Button component={Link} to="/requests/new" data-testid="goto-new-request">
          New request
        </Button>
      </Group>

      <Group grow align="flex-end">
        <TextInput
          label="Search"
          placeholder="Title, requester, resource, id…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          data-testid="search-input"
        />
        <Select
          label="Status"
          data={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "denied", label: "Denied" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          data-testid="status-filter"
        />
      </Group>

      {error ? (
        <Text c="red" role="alert" data-testid="error">
          {error}
        </Text>
      ) : null}

      <Table striped highlightOnHover withTableBorder data-testid="requests-table">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Requester</Table.Th>
            <Table.Th>Resource</Table.Th>
            <Table.Th>Level</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody data-testid="requests-list">
          {filtered.map((r) => (
            <Table.Tr key={r.id} data-testid={`request-${r.id}`}>
              <Table.Td>
                <Anchor component={Link} to={`/requests/${r.id}`} data-testid={`link-${r.id}`}>
                  {r.title}
                </Anchor>
              </Table.Td>
              <Table.Td>{r.requester}</Table.Td>
              <Table.Td>{r.resource}</Table.Td>
              <Table.Td>{r.accessLevel}</Table.Td>
              <Table.Td>
                <span data-testid={`status-${r.id}`}>
                  <StatusBadge status={r.status} />
                </span>
              </Table.Td>
              <Table.Td>
                {r.status === "pending" ? (
                  <Group gap="xs">
                    <Button
                      size="xs"
                      color="green"
                      data-testid={`approve-${r.id}`}
                      disabled={actingId === r.id}
                      onClick={() => void onDecide(r.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      variant="light"
                      data-testid={`deny-${r.id}`}
                      disabled={actingId === r.id}
                      onClick={() => void onDecide(r.id, "denied")}
                    >
                      Deny
                    </Button>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">
                    —
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
          {filtered.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text c="dimmed" ta="center" py="md" data-testid="empty-requests">
                  No matching requests
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : null}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
