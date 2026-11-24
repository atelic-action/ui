import type { Meta, StoryObj } from "@storybook/react-vite";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, waitFor } from "storybook/test";
import { ExpandableText } from "../../src/primitives";
import { lines as lineCount } from "../support/geometry";
import { pin } from "../support/viewports";

const longText =
	"Every loaf on the shelf was mixed the night before and baked from four in the morning, so the first ones out of the oven are still warm when the door opens at seven. We bake rye on Tuesdays and Fridays, the seeded spelt on weekends, and a short run of sweet buns whenever the plums are good. A standing order holds your loaves behind the counter until noon.";

/**
 * Long text cut to a few lines with a Show more control under it. The cut
 * is drawn, never made: every word stays in the page.
 */
const meta = {
	title: "Primitives/ExpandableText",
	component: ExpandableText,
	args: { children: longText, lines: 2 },
	decorators: [
		(Story) => (
			<div className="wrap" style={{ maxWidth: 520, paddingBlock: 24 }}>
				<Story />
			</div>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof ExpandableText>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = Parameters<NonNullable<Story["play"]>>[0]["canvas"];
const body = (canvas: Canvas) => canvas.getByText(/Every loaf on the shelf/);

/**
 * Closed, the text shows two lines; Show more opens the rest and becomes
 * Show less, which closes it again. The control says which it is.
 */
export const OpensAndCloses: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const more = canvas.getByRole("button", { name: "Show more" });
		await step("closed, two lines show and the control is collapsed", async () => {
			await expect(more).toHaveAttribute("aria-expanded", "false");
			await expect(more).toHaveAttribute("aria-controls", body(canvas).id);
			const clamped = body(canvas).getBoundingClientRect().height;
			const lineHeight = Number.parseFloat(getComputedStyle(body(canvas)).lineHeight);
			await expect(Math.round(clamped / lineHeight)).toBe(2);
		});
		await step("Show more opens every line", async () => {
			await userEvent.click(more);
			await expect(more).toHaveAttribute("aria-expanded", "true");
			await expect(more).toHaveAccessibleName("Show less");
			await expect(lineCount(body(canvas))).toBeGreaterThan(2);
		});
		await step("Show less closes it, by the keyboard too", async () => {
			more.focus();
			await userEvent.keyboard("{Enter}");
			await expect(more).toHaveAttribute("aria-expanded", "false");
			await expect(more).toHaveFocus();
		});
	},
};

/** Clamped or not, a screen reader and a search find every word. */
export const EveryWordStaysInThePage: Story = {
	play: async ({ canvas }) => {
		await expect(body(canvas).textContent).toBe(longText);
	},
};

/**
 * What a reader acts on goes in `more`: shown once opened, and while closed
 * out of the tab order as well as out of sight.
 */
export const WithLinks: Story = {
	args: {
		more: (
			<span style={{ display: "flex", gap: 16 }}>
				<a href="https://kestrelhollow.example.com/terms">Terms</a>
				<a href="https://kestrelhollow.example.com/privacy">Privacy policy</a>
			</span>
		),
	},
	play: async ({ canvas, userEvent, step }) => {
		await step("closed, the links are neither shown nor reachable", async () => {
			await expect(canvas.queryByRole("link", { name: "Terms" })).toBeNull();
			const hidden = canvas.getByText("Terms");
			hidden.focus();
			await expect(hidden).not.toHaveFocus();
		});
		await step("opened, they show and take focus", async () => {
			const more = canvas.getByRole("button", { name: "Show more" });
			await userEvent.click(more);
			const terms = canvas.getByRole("link", { name: "Terms" });
			await expect(terms).toBeVisible();
			await userEvent.tab({ shift: true });
			await expect(canvas.getByRole("link", { name: "Privacy policy" })).toHaveFocus();
		});
	},
};

/** As a checkbox's label, the checkbox is named by the whole text, clamped or not. */
export const LabelsACheckbox: Story = {
	render: (args) => (
		<div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
			<input id="standing-order-consent" type="checkbox" style={{ marginTop: 4 }} />
			<ExpandableText {...args} labelFor="standing-order-consent" />
		</div>
	),
	play: async ({ canvas, userEvent }) => {
		const box = canvas.getByRole("checkbox");
		await expect(box).toHaveAccessibleName(longText);
		await userEvent.click(body(canvas));
		await expect(box).toBeChecked();
		await userEvent.click(canvas.getByRole("button", { name: "Show more" }));
		await expect(box).toBeChecked();
	},
};

/** The site's own words for the control. */
export const OwnWords: Story = {
	args: { moreLabel: "Read it all", lessLabel: "Fold it up" },
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Read it all" }));
		await expect(canvas.getByRole("button", { name: "Fold it up" })).toBeVisible();
	},
};

/** Text that fits in its lines draws no control. */
export const FitsAlready: Story = {
	args: { children: "Open from seven." },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("button")).toBeNull();
	},
};

/** On a phone the same two lines, narrower. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Show more" })).toBeVisible();
	},
};

/**
 * Inline over text that fits its lines: nothing is hidden, so no control is
 * drawn and what `more` holds shows at once (8.6.0).
 */
export const InlineFits: Story = {
	args: {
		children: "Open from seven.",
		inline: true,
		more: <a href="https://kestrelhollow.example.com/hours">Holiday hours</a>,
	},
	play: async ({ canvas }) => {
		await waitFor(() => expect(canvas.queryByRole("button")).toBeNull());
		await expect(canvas.getByRole("link", { name: "Holiday hours" })).toBeVisible();
	},
};

/**
 * A prerendered inline text never moves the page when it is measured:
 * the text and what follows it sit where they sat before hydration, cut or
 * fitting, and the control is unseen and unreachable until the text is
 * measured as cut.
 */
export const InlinePrerenderNeverMoves: Story = {
	args: { inline: true, lines: 1 },
	render: () => <div data-prerender-host="" />,
	play: async ({ canvasElement, step }) => {
		const host = canvasElement.querySelector("[data-prerender-host]") as HTMLElement;
		const cases = [
			["a cut text", longText],
			["a text that fits", "Open from seven."],
		] as const;
		for (const [name, words] of cases) {
			await step(name, async () => {
				const element = (
					<ExpandableText inline lines={1}>
						{words}
					</ExpandableText>
				);
				host.innerHTML = "";
				const holder = document.createElement("div");
				const after = document.createElement("p");
				after.textContent = "What follows";
				host.append(holder, after);
				holder.innerHTML = renderToString(element);
				const body = () => holder.querySelector(".expandable-text-body") as HTMLElement;
				const before = [body().getBoundingClientRect().top, after.getBoundingClientRect().top];
				const toggle = holder.querySelector("button");
				if (toggle) {
					await expect(toggle).toHaveAttribute("aria-hidden", "true");
					await expect(toggle).toHaveAttribute("tabindex", "-1");
					await expect(getComputedStyle(toggle).visibility).toBe("hidden");
				}
				const root = hydrateRoot(holder, element);
				await new Promise((resolve) => setTimeout(resolve, 100));
				await expect([
					body().getBoundingClientRect().top,
					after.getBoundingClientRect().top,
				]).toEqual(before);
				root.unmount();
			});
		}
	},
};

/** Inline over text that runs past its lines: once measured, the control sits on the last line's end. */
export const InlineCut: Story = {
	args: { inline: true, lines: 1 },
	play: async ({ canvas }) => {
		const more = canvas.getByRole("button", { name: "Show more" });
		const words = canvas.getByText(/Every loaf on the shelf/);
		await waitFor(() =>
			expect(Math.round(more.getBoundingClientRect().bottom)).toBe(
				Math.round(words.getBoundingClientRect().bottom),
			),
		);
		await expect(getComputedStyle(more, "::before").content).not.toBe("none");
	},
};
