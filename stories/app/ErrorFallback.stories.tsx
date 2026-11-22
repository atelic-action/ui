import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component, type ReactNode } from "react";
import { expect, fn } from "storybook/test";
import { ErrorFallback } from "../../src/app";
import { pin } from "../support/viewports";
import { layerOpened } from "./layers";

/**
 * What an error boundary shows when a page crashes: an apology, an optional
 * message for a developer, and a button that resets the boundary.
 */
const meta = {
	title: "App/ErrorFallback",
	component: ErrorFallback,
	args: { error: new Error("Cannot read the tray count of undefined"), resetError: fn() },
	globals: pin("desktop"),
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

/** In production: the apology and the retry, no message. */
export const Default: Story = {
	play: async ({ canvas, args, userEvent }) => {
		await expect(
			canvas.getByRole("heading", { level: 1, name: "Something went wrong" }),
		).toBeVisible();
		await expect(canvas.queryByText("Cannot read the tray count of undefined")).toBeNull();
		await userEvent.click(canvas.getByRole("button", { name: "Try Again" }));
		await expect(args.resetError).toHaveBeenCalledOnce();
	},
};

/** The retry answers the keyboard too. */
export const RetryByKeyboard: Story = {
	play: async ({ canvas, args, userEvent }) => {
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "Try Again" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(args.resetError).toHaveBeenCalledOnce();
	},
};

/**
 * While developing, the error's message shows under the apology, in muted
 * grey on the muted well (4.81 to 1). The box takes focus, so a keyboard
 * reaches it after the apology and before the retry, and can scroll it.
 */
export const WithDetails: Story = {
	args: { showDetails: true },
	play: async ({ canvas, userEvent }) => {
		const details = canvas.getByText("Cannot read the tray count of undefined");
		await expect(details).toBeVisible();
		await userEvent.tab();
		await expect(details).toHaveFocus();
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "Try Again" })).toHaveFocus();
	},
};

/** A thrown value that is not an Error reads as an unknown error. */
export const NotAnError: Story = {
	args: { error: "the oven timer", showDetails: true },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Unknown error")).toBeVisible();
	},
};

/**
 * A long stack scrolls inside its box on a phone, the column no wider than
 * the screen, so the page never scrolls sideways.
 */
export const LongDetailsPhone: Story = {
	args: {
		showDetails: true,
		error: new Error(
			`Failed to load /v1/bakes/recipes/country-sourdough-with-toasted-seeds-and-a-long-cold-retard?scale=4\n${"    at RecipeScaler (recipes.tsx:42:7)\n".repeat(12)}`,
		),
	},
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Try Again" })).toBeVisible();
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		const details = canvas.getByText(/Failed to load/);
		await expect(details.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
		await expect(details.scrollWidth).toBeGreaterThan(details.clientWidth);
	},
};

/** The page's cause of failure, which the retry clears, as a dropped request comes back. */
const scale = { down: true };

function RecipesPage() {
	if (scale.down) throw new Error("The scale dropped its connection");
	return <h1>Recipes</h1>;
}

class Boundary extends Component<{ children: ReactNode; onReset: () => void }, { error: unknown }> {
	state: { error: unknown } = { error: null };
	static getDerivedStateFromError(error: unknown) {
		return { error };
	}
	render() {
		if (this.state.error) {
			return (
				<ErrorFallback
					error={this.state.error}
					resetError={() => {
						this.props.onReset();
						this.setState({ error: null });
					}}
				/>
			);
		}
		return this.props.children;
	}
}

/** Inside a real boundary: the fallback shows, and Try Again brings the page back. */
export const RetryRecovers: Story = {
	beforeEach: () => {
		scale.down = true;
	},
	render: () => (
		<Boundary onReset={() => (scale.down = false)}>
			<RecipesPage />
		</Boundary>
	),
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(
			await layerOpened(() => canvas.getByRole("button", { name: "Try Again" })),
		);
		await expect(
			await layerOpened(() => canvas.getByRole("heading", { name: "Recipes" })),
		).toBeVisible();
		await expect(canvas.queryByRole("heading", { name: "Something went wrong" })).toBeNull();
	},
};
