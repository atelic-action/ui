import { Link, useNavigate } from "@tanstack/react-router";
import {
	BookOpen,
	CalendarClock,
	ClipboardList,
	House,
	LogOut,
	Plus,
	RefreshCw,
	ShieldCheck,
	Truck,
	UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	AppPage,
	AppPageToolbar,
	Breadcrumbs,
	CardErrorBoundary,
	GoogleGlyph,
	matchesSearch,
	PageError,
	PageSkeleton,
	partOfDay,
	SectionCards,
	useAuthStore,
	useUser,
} from "../../src/app";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Progress,
} from "../../src/app/ui";
import { bakes, type OrderStatus, orders, recipes, statusLabel } from "./data";
import { signIn, signOut } from "./session";

const statusVariant: Record<OrderStatus, "default" | "secondary" | "outline"> = {
	proofing: "outline",
	baking: "secondary",
	packed: "default",
	out: "secondary",
};

/** Signed out, "/" is the landing; signed in, it is the home page. */
export function IndexPage() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	return isAuthenticated ? <HomePage /> : <Landing />;
}

function Landing() {
	const navigate = useNavigate();
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-6">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<div className="mb-2 flex items-center justify-center gap-2">
						<span className="inline-block size-2 rounded-full bg-brand" aria-hidden="true" />
						<span className="text-lg font-medium tracking-tight">crumb</span>
					</div>
					<CardTitle className="text-2xl">Signed out</CardTitle>
					<CardDescription>
						AuthGuard sent you here: a signed out visitor sees only the public routes and the public
						pages. Sign back in to see the shell again.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<Button
						variant="outline"
						onClick={() => {
							signIn();
							navigate({ to: "/" });
						}}
					>
						<GoogleGlyph className="h-4 w-4" />
						Sign in with Google
					</Button>
					<Link to="/u/rosa" className="text-center text-sm text-muted-foreground hover:underline">
						Rosa's public page
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}

function HomePage() {
	const { user } = useUser();
	return (
		<AppPage
			crumb={<Breadcrumbs items={[{ label: "Home" }]} />}
			icon={<House className="h-7 w-7" />}
			title="Home"
			subtitle={`${partOfDay()}, ${user?.firstName ?? "you"}. Where to?`}
		>
			<SectionCards section="/orders" />
			<SectionCards section="/bakes" />
		</AppPage>
	);
}

function OrdersRail() {
	const wholesale = orders.filter((order) => order.wholesale).length;
	return (
		<div className="flex flex-col gap-6">
			<div>
				<p className="kit-label">Due today</p>
				<p className="text-4xl font-light tracking-tight">{orders.length}</p>
				<p className="text-sm text-muted-foreground">
					{wholesale} wholesale, {orders.length - wholesale} counter
				</p>
			</div>
			<div>
				<p className="kit-label">Next out</p>
				<p className="font-medium">The Larkspur</p>
				<p className="text-sm text-muted-foreground">10:15, twelve country loaves</p>
			</div>
		</div>
	);
}

export function OrdersPage() {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const visible = useMemo(
		() =>
			orders.filter(
				(order) =>
					(status === "all" || order.status === status) &&
					(!search || matchesSearch(search, [order.customer, order.items])),
			),
		[search, status],
	);
	const count = (value: OrderStatus) => orders.filter((order) => order.status === value).length;

	return (
		<AppPage
			crumb={<Breadcrumbs items={[{ label: "Orders" }]} />}
			icon={<ClipboardList className="h-7 w-7" />}
			title="Today"
			live
			subtitle="Every order due out of the kitchen today."
			toolbar={
				<AppPageToolbar
					search={{ value: search, onChange: setSearch, placeholder: "Search orders" }}
					filters={[
						{
							value: status,
							onChange: setStatus,
							ariaLabel: "Status",
							options: [
								{ value: "all", label: "Every status", count: orders.length },
								...(Object.keys(statusLabel) as OrderStatus[]).map((value) => ({
									value,
									label: statusLabel[value],
									count: count(value),
								})),
							],
						},
					]}
					actions={[
						{ label: "Sync", icon: <RefreshCw size={15} />, ago: "06:12", variant: "ghost" },
						{ label: "New order", icon: <Plus size={15} />, variant: "solid" },
					]}
				/>
			}
			rail={<OrdersRail />}
		>
			<div className="ap-body grid gap-3">
				{visible.map((order) => (
					<Card key={order.id}>
						<CardContent className="flex items-start justify-between gap-4 py-4">
							<div className="min-w-0">
								<p className="font-medium">{order.customer}</p>
								<p className="text-sm text-muted-foreground">{order.items}</p>
							</div>
							<div className="flex shrink-0 flex-col items-end gap-2">
								<span className="font-mono text-sm">{order.due}</span>
								<Badge variant={statusVariant[order.status]}>{statusLabel[order.status]}</Badge>
							</div>
						</CardContent>
					</Card>
				))}
				{visible.length === 0 && (
					<p className="py-8 text-center text-sm text-muted-foreground">No order matches.</p>
				)}
			</div>
		</AppPage>
	);
}

export function WholesalePage() {
	return (
		<AppPage
			crumb={<Breadcrumbs items={[{ label: "Orders", to: "/orders" }, { label: "Wholesale" }]} />}
			icon={<Truck className="h-7 w-7" />}
			title="Wholesale"
			subtitle="The cafes on a standing order."
		>
			<div className="ap-body grid gap-3 md:grid-cols-2">
				{orders
					.filter((order) => order.wholesale)
					.map((order) => (
						<Card key={order.id}>
							<CardHeader>
								<CardTitle className="text-lg">{order.customer}</CardTitle>
								<CardDescription>{order.items}</CardDescription>
							</CardHeader>
						</Card>
					))}
			</div>
		</AppPage>
	);
}

export function BakesPage() {
	return (
		<AppPage
			crumb={<Breadcrumbs items={[{ label: "Bakes" }]} />}
			icon={<CalendarClock className="h-7 w-7" />}
			title="Schedule"
			subtitle="What goes in the oven, and when."
		>
			<SectionCards section="/bakes" />
			<div className="ap-body grid gap-4">
				{bakes.map((bake) => (
					<div key={bake.name} className="flex flex-col gap-2">
						<div className="flex items-baseline justify-between text-sm">
							<span className="font-medium">{bake.name}</span>
							<span className="font-mono text-muted-foreground">{bake.start}</span>
						</div>
						<Progress value={bake.progress} aria-label={`${bake.name} progress`} />
					</div>
				))}
			</div>
		</AppPage>
	);
}

export function RecipesPage() {
	return (
		<AppPage
			crumb={<Breadcrumbs items={[{ label: "Bakes", to: "/bakes" }, { label: "Recipes" }]} />}
			icon={<BookOpen className="h-7 w-7" />}
			title="Recipes"
			subtitle="The formulas, scaled by the batch."
		>
			<div className="ap-body grid gap-3 md:grid-cols-3">
				{recipes.map((recipe) => (
					<Card key={recipe.name}>
						<CardHeader>
							<CardTitle className="text-lg">{recipe.name}</CardTitle>
							<CardDescription>
								{recipe.yield}, {recipe.hydration} hydration
							</CardDescription>
						</CardHeader>
					</Card>
				))}
			</div>
		</AppPage>
	);
}

function Unbaked(): never {
	throw new Error("This card was asked for a recipe that does not exist.");
}

export function StatesPage() {
	const navigate = useNavigate();
	return (
		<AppPage
			crumb={<Breadcrumbs items={[{ label: "States" }]} />}
			icon={<ShieldCheck className="h-7 w-7" />}
			title="States"
			subtitle="Loading, failing, and signed out."
		>
			<div className="ap-body grid gap-8">
				<section>
					<p className="kit-label">AuthGuard, signed out</p>
					<Card>
						<CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm text-muted-foreground">
								Signed out, every route but the public ones sends the visitor home, and a public
								page wears the brand bar in place of the rail.
							</p>
							<div className="flex shrink-0 gap-2">
								<Button
									variant="outline"
									onClick={() => {
										signOut();
										navigate({ to: "/" });
									}}
								>
									<LogOut />
									Sign out
								</Button>
								<Button variant="ghost" asChild>
									<Link to="/u/rosa">
										<UserRound />
										Public page
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</section>
				<section>
					<p className="kit-label">PageError</p>
					<PageError title="Orders did not load" message="The api answered 503. Try again." />
				</section>
				<section>
					<p className="kit-label">CardErrorBoundary</p>
					<CardErrorBoundary>
						<Unbaked />
					</CardErrorBoundary>
				</section>
				<section>
					<p className="kit-label">PageSkeleton</p>
					<PageSkeleton showHeaderAction cardCount={2} cardLayout="two-column" />
				</section>
			</div>
		</AppPage>
	);
}

/** A public page: the brand bar signed out, the full shell signed in. */
export function PublicProfilePage() {
	return (
		<AppPage
			crumb={<Breadcrumbs items={[{ label: "Rosa" }]} />}
			icon={<UserRound className="h-7 w-7" />}
			title="Rosa Delgado"
			subtitle="Head baker at Crumb & Co. Mornings since 2014."
		>
			<div className="ap-body">
				<p className="text-sm text-muted-foreground">
					A page anyone can read. Signed out it renders in the public chrome; signed in, inside the
					rail and the tab bar like every other page.
				</p>
			</div>
		</AppPage>
	);
}

/** Where the shell's Profile link lands: the account page an app owns. */
export function AccountPage() {
	return (
		<AppPage
			icon={<UserRound className="h-7 w-7" />}
			title="Profile"
			subtitle="The signed in account."
		>
			<div className="ap-body">
				<p className="text-sm text-muted-foreground">
					The rail and the menu link here. An app owns this page; the shell only carries the link.
				</p>
			</div>
		</AppPage>
	);
}
