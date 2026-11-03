import { Badge } from "@mantine/core";

const colors: Record<string, string> = {
  pending: "yellow",
  approved: "green",
  denied: "red",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge color={colors[status] ?? "gray"} variant="light" data-testid={`status-${status}`}>
      {status}
    </Badge>
  );
}
