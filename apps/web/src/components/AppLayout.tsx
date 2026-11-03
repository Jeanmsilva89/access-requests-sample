import {
	AppShell,
	Badge,
	Burger,
	Group,
	NavLink,
	Text,
	Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useMockFlag } from "../lib/mockContext";

const navItems = [
	{ to: "/", label: "Dashboard", testId: "nav-dashboard", end: true },
	{ to: "/requests", label: "Requests", testId: "nav-requests", end: false },
	{
		to: "/requests/new",
		label: "New Request",
		testId: "nav-new-request",
		end: true,
	},
	{ to: "/audit", label: "Audit Log", testId: "nav-audit", end: true },
];

export function AppLayout() {
	const [opened, { toggle }] = useDisclosure();
	const location = useLocation();
	const { isMock } = useMockFlag();

	return (
		<AppShell
			header={{ height: isMock ? 96 : 60 }}
			navbar={{
				width: 240,
				breakpoint: "sm",
				collapsed: { mobile: !opened },
			}}
			padding="md"
		>
			<AppShell.Header>
				<Group h={60} px="md" justify="space-between">
					<Group>
						<Burger
							opened={opened}
							onClick={toggle}
							hiddenFrom="sm"
							size="sm"
						/>
						<Title order={3} data-testid="app-title">
							Access Requests
						</Title>
					</Group>
					<Badge variant="outline" color="gray">
						Internal
					</Badge>
				</Group>
				{isMock ? (
					<Text
						bg="yellow.3"
						c="dark"
						fw={600}
						ta="center"
						py={8}
						px="md"
						data-testid="sandbox-banner"
						style={{ borderTop: "1px solid var(--mantine-color-yellow-5)" }}
					>
						Running against mocks (sandbox)
					</Text>
				) : null}
			</AppShell.Header>

			<AppShell.Navbar p="md">
				{navItems.map((item) => {
					const active = item.end
						? location.pathname === item.to
						: location.pathname === item.to ||
							(item.to === "/requests" &&
								location.pathname.startsWith("/requests/") &&
								location.pathname !== "/requests/new");
					return (
						<NavLink
							key={item.to}
							component={Link}
							to={item.to}
							label={item.label}
							active={active}
							data-testid={item.testId}
							onClick={() => {
								if (opened) toggle();
							}}
						/>
					);
				})}
			</AppShell.Navbar>

			<AppShell.Main>
				<Outlet />
			</AppShell.Main>
		</AppShell>
	);
}
