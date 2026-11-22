import type { Meta, StoryObj } from "@storybook/react-vite";
import { useLocation } from "@tanstack/react-router";
import { expect } from "storybook/test";
import { AuthGuard } from "../../src/app";
import { signIn, signOut } from "../fixtures/email-app";
import { until } from "../support/settle";
import { pin } from "../support/viewports";

/** Where the memory router is, printed outside the guard so a story can read it after a redirect. */
function Where() {
	const pathname = useLocation({ select: (location) => location.pathname });
	return <p>Router at {pathname}</p>;
}

/**
 * The guard around every route that needs a session. Signed out, anything
 * but the app's public routes and pages redirects to "/", which renders the
 * sign in page; signed in, it renders its children. The stories run under a
 * memory router and read where it ends up.
 */
const meta = {
	title: "App/AuthGuard",
	component: AuthGuard,
	parameters: { layout: "padded", app: { path: "/orders/wholesale" } },
	render: (args) => (
		<>
			<Where />
			<AuthGuard {...args} />
		</>
	),
	args: { children: <h1>Standing orders</h1> },
	globals: pin("desktop"),
} satisfies Meta<typeof AuthGuard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Signed in, a private page renders where it is. */
export const SignedIn: Story = {
	beforeEach: signIn(),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { name: "Standing orders" })).toBeVisible();
		await expect(canvas.getByText("Router at /orders/wholesale")).toBeVisible();
	},
};

/** Signed out, a private page redirects home, where the sign in page renders. */
export const SignedOutRedirects: Story = {
	beforeEach: signOut,
	play: async ({ canvas }) => {
		await until(() => expect(canvas.getByText("Router at /")).toBeVisible());
	},
};

/** Signed out, an exact public route renders without a redirect. */
export const SignedOutPublicRoute: Story = {
	beforeEach: signOut,
	parameters: { app: { path: "/" } },
	args: { children: <h1>Sign in to Crumb &amp; Co.</h1> },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { name: "Sign in to Crumb & Co." })).toBeVisible();
		await expect(canvas.getByText("Router at /")).toBeVisible();
	},
};

/** Signed out, a public page pattern (`/u/*`) renders too: a person's shared recipe. */
export const SignedOutPublicPage: Story = {
	beforeEach: signOut,
	parameters: { app: { path: "/u/wren/country-loaf" } },
	args: { children: <h1>Wren's country loaf</h1> },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { name: "Wren's country loaf" })).toBeVisible();
		await expect(canvas.getByText("Router at /u/wren/country-loaf")).toBeVisible();
	},
};

/** The pattern is a prefix with its slash: `/u` alone is not a public page and redirects. */
export const SignedOutPatternRoot: Story = {
	beforeEach: signOut,
	parameters: { app: { path: "/u" } },
	play: async ({ canvas }) => {
		await until(() => expect(canvas.getByText("Router at /")).toBeVisible());
	},
};
