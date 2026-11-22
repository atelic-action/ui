import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Watermark } from "../../src/components";
import { knownIssues } from "../support/known-issues";
import { PageBehind } from "../support/page";

const viewer = "rosa@quillandfern.example.com";

/** Sets the gate's readable cookies for a story and clears them after. */
function signedIn(mode?: "pill" | "tiled") {
	return () => {
		document.cookie = `gate_email=${encodeURIComponent(viewer)}; path=/`;
		if (mode) document.cookie = `gate_wm=${mode}; path=/`;
		return () => {
			document.cookie = "gate_email=; path=/; max-age=0";
			document.cookie = "gate_wm=; path=/; max-age=0";
		};
	};
}

/**
 * The confidential stamp on every page behind the access gate: the signed in
 * viewer's email in a corner pill, and a faint tiled layer in tiled mode.
 * It is hidden from a screen reader and renders nothing without a session.
 */
const meta = {
	title: "Components/Watermark",
	component: Watermark,
	decorators: [
		(Story) => (
			<>
				<PageBehind />
				<Story />
			</>
		),
	],
} satisfies Meta<typeof Watermark>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No session cookie: nothing at all. */
export const SignedOut: Story = {
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector("[aria-hidden='true']")).toBeNull();
		await expect(canvasElement).not.toHaveTextContent(/Confidential/);
	},
};

/** Signed in: the corner pill carries the viewer's email, hidden from assistive tech. */
export const Pill: Story = {
	beforeEach: signedIn(),
	play: async ({ canvas }) => {
		await waitFor(() => expect(canvas.getByText(viewer)).toBeInTheDocument());
		const pill = canvas.getByText(/Confidential preview/).closest("[aria-hidden='true']");
		await expect(pill).toBeTruthy();
		await expect(canvas.queryByText(/confidential ·/)).toBeNull();
	},
};

/**
 * Tiled mode: the pill and a faint tiled layer of the email over the page.
 * The layer is faint by design, which the contrast checker cannot tell from
 * a bug (stories/findings/primitives.md, Checker Limits).
 */
export const Tiled: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("checker-watermark-tiles") },
	beforeEach: signedIn("tiled"),
	play: async ({ canvas }) => {
		await waitFor(() => expect(canvas.getAllByText(/confidential ·/)).toHaveLength(32));
		await expect(canvas.getByText(/Confidential preview/)).toBeInTheDocument();
	},
};
