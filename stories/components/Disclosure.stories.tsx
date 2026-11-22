import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, type ReactNode, useState } from "react";
import { expect, fn } from "storybook/test";
import { Disclosure, type DisclosureControlledProps } from "../../src/components";
import { longWord } from "../fixtures/primitives";
import { inWrap } from "../primitives/support";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Both forms' props in one shape, for the story args: the component picks
 * its form by whether `open` or `onToggle` is passed, which its own union
 * type expresses and a story's args cannot.
 */
interface EitherProps {
	label: ReactNode;
	summary?: ReactNode;
	defaultOpen?: boolean;
	open?: boolean;
	onToggle?: () => void;
	panelId?: string;
	className?: string;
	children: ReactNode;
}

/** The detail behind a fold, with a link so the tab order can be read. */
const body = (
	<div style={{ padding: "12px 18px" }}>
		<p>
			Order by Friday noon and the loaf waits at the counter; <a href="/order">order ahead</a>.
		</p>
	</div>
);

/** An app's card, held by a caller that remembers whether it is open. */
function Held(props: Omit<DisclosureControlledProps, "open" | "onToggle"> & { initial?: boolean }) {
	const { initial = false, ...rest } = props;
	const [open, setOpen] = useState(initial);
	return <Disclosure {...rest} open={open} onToggle={() => setOpen((o) => !o)} />;
}

/**
 * A section the reader opens and closes. Left to the browser it is a native
 * details element, a document's fold; held by the caller (`open` and
 * `onToggle`) it is an app's card, whose closed body is not rendered.
 */
const meta = {
	title: "Components/Disclosure",
	component: Disclosure as unknown as ComponentType<EitherProps>,
	decorators: [
		(Story) => (
			<>
				<Story />
				<p style={{ marginTop: 16 }}>
					<a href="/visit">After the fold</a>
				</p>
			</>
		),
		inWrap,
	],
	args: {
		label: "How the Saturday order works",
		summary: "Order by Friday noon; the loaf waits for you at the counter.",
		children: body,
	},
} satisfies Meta<EitherProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Native and closed: the detail is not shown and its link is out of the tab
 * order. A click on the line opens it, a second click closes it.
 */
export const NativeOpensAndCloses: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const details = canvas.getByRole("group") as HTMLDetailsElement;
		const line = canvas.getByText("How the Saturday order works");
		await step("closed, the summary line shows and the detail is hidden", async () => {
			await expect(details.open).toBe(false);
			await expect(canvas.getByText(/Order by Friday noon;/)).toBeVisible();
			await expect(canvas.getByRole("link", { name: "order ahead" })).not.toBeVisible();
		});
		await step("the line is the one stop; the hidden link cannot take focus", async () => {
			await userEvent.tab();
			await expect(document.activeElement?.tagName).toBe("SUMMARY");
			// The test's Tab does not know a closed details hides its content, so
			// ask the browser directly: a link it will not focus is out of the order.
			const hidden = canvas.getByRole("link", { hidden: true, name: "order ahead" });
			hidden.focus();
			await expect(hidden).not.toHaveFocus();
		});
		await step("a click opens it, and its link joins the tab order", async () => {
			await userEvent.click(line);
			await expect(details.open).toBe(true);
			const link = canvas.getByRole("link", { name: "order ahead" });
			await expect(link).toBeVisible();
			link.focus();
			await expect(link).toHaveFocus();
		});
		await step("a second click closes it", async () => {
			await userEvent.click(line);
			await expect(details.open).toBe(false);
		});
	},
};

/** Open on first render. */
export const NativeDefaultOpen: Story = {
	args: { defaultOpen: true },
	play: async ({ canvas }) => {
		await expect((canvas.getByRole("group") as HTMLDetailsElement).open).toBe(true);
		await expect(canvas.getByRole("link", { name: "order ahead" })).toBeVisible();
	},
};

/** The label alone, with no summary line. */
export const NativeNoSummary: Story = { args: { summary: undefined } };

/** The longest label and summary on a phone. */
export const NativeLongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		label: "How the Saturday order works, from the Friday noon cutoff to the counter pickup",
		summary:
			"Order by Friday noon and the loaf waits at the counter, wrapped and labeled, until two in the afternoon; after that it goes to the shelf.",
		defaultOpen: true,
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/**
 * Held by the caller: the label is the toggle, `aria-expanded` follows it,
 * and a closed body is not in the page at all, so its link is never in the
 * tab order.
 */
export const HeldOpensAndCloses: Story = {
	render: (args) => <Held label={args.label}>{args.children}</Held>,
	play: async ({ canvas, userEvent, step }) => {
		const toggle = canvas.getByRole("button", { name: "How the Saturday order works" });
		await step("closed: collapsed and no body", async () => {
			await expect(toggle).toHaveAttribute("aria-expanded", "false");
			await expect(canvas.queryByRole("link", { name: "order ahead" })).toBeNull();
		});
		await step("the click opens it and the body it controls appears", async () => {
			await userEvent.click(toggle);
			await expect(toggle).toHaveAttribute("aria-expanded", "true");
			const id = toggle.getAttribute("aria-controls") as string;
			await expect(document.getElementById(id)).toContainElement(
				canvas.getByRole("link", { name: "order ahead" }),
			);
		});
		await step("the keyboard closes it again, focus staying on the toggle", async () => {
			await expect(toggle).toHaveFocus();
			await userEvent.keyboard("{Enter}");
			await expect(toggle).toHaveAttribute("aria-expanded", "false");
			await userEvent.keyboard(" ");
			await expect(toggle).toHaveAttribute("aria-expanded", "true");
			await expect(toggle).toHaveFocus();
		});
	},
};

/**
 * Meta sits beside the label and outside its name, and a tap on it still
 * folds the section: the toggle's hit area covers the whole header row.
 */
export const HeldWithMeta: Story = {
	render: (args) => (
		<Held label="Produce" meta={<span>10 items</span>} headingLevel={3}>
			{args.children}
		</Held>
	),
	play: async ({ canvas, userEvent }) => {
		const toggle = canvas.getByRole("button", { name: "Produce" });
		await expect(canvas.getByRole("heading", { level: 3 })).toContainElement(toggle);
		const meta = canvas.getByText("10 items").getBoundingClientRect();
		const hit = document.elementFromPoint(meta.left + meta.width / 2, meta.top + meta.height / 2);
		await expect(hit).toBe(toggle);
		await userEvent.click(hit as Element);
		await expect(toggle).toHaveAttribute("aria-expanded", "true");
	},
};

/** Held open from the start, with a caller's own panel id. */
export const HeldOpen: Story = {
	args: { open: true, onToggle: fn(), panelId: "saturday-order", summary: undefined },
	play: async ({ canvas, userEvent, args }) => {
		const toggle = canvas.getByRole("button", { name: "How the Saturday order works" });
		await expect(toggle).toHaveAttribute("aria-controls", "saturday-order");
		await expect(document.getElementById("saturday-order")).toBeVisible();
		await userEvent.click(toggle);
		await expect(args.onToggle).toHaveBeenCalledOnce();
	},
};

/** A held card with the longest label and an unbroken word, on a phone. */
export const HeldLongestOnPhone: Story = {
	globals: pin("phone"),
	render: (args) => (
		<Held
			label={`Standing orders of ${longWord} for every cafe`}
			meta={<span>24 items</span>}
			initial
		>
			{args.children}
		</Held>
	),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
