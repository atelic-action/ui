import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { ArtifactShell, Paragraph } from "../../src/artifact";
import { ReportCard } from "../../src/components";
import { artifactSite, reportGroups } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../primitives/support";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";

/** A document page: two sections the header's stops point at, then the sign off line. */
function Page() {
	return (
		<div className="wrap" style={{ paddingTop: "calc(var(--nav-height) + 32px)" }}>
			<h1>The bakery's read</h1>
			<section id="glance" style={{ minHeight: "60vh" }}>
				<ReportCard label="At a glance" groups={reportGroups.slice(0, 1)} />
			</section>
			<section id="next" style={{ minHeight: "60vh" }}>
				<h2>What comes next</h2>
				<Paragraph paragraph="Fix the order form first; everything else can wait a week." />
			</section>
		</div>
	);
}

const stops = [
	{ id: "glance", label: "At a glance" },
	{ id: "next", label: "What comes next" },
];

/**
 * The wrapper every artifact page wears: its own `.atelic-ui` root pinned to
 * the comfortable density, the skip link, the dark header with both
 * parties' lockup and no site nav, the page, the closing bar, and the gate's
 * watermark.
 */
const meta = {
	title: "Artifact/ArtifactShell",
	component: ArtifactShell,
	parameters: { root: false },
	args: { site: artifactSite, currentPath: "/", stops, children: <Page /> },
	globals: pin("desktop"),
} satisfies Meta<typeof ArtifactShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The `--section-space` a root at a given density resolves, read off a probe beside the story. */
function sectionSpace(density: string) {
	const probe = document.createElement("div");
	probe.className = "atelic-ui";
	probe.dataset.density = density;
	document.body.append(probe);
	const value = getComputedStyle(probe).getPropertyValue("--section-space");
	probe.remove();
	return value;
}

/**
 * The page: a header holding the sender's mark beside the recipient's and
 * the page's own stops, the main region, and the closing bar in the
 * sender's name. The shell never shows a site nav or a call to action.
 */
export const DocumentPage: Story = {
	play: async ({ canvas }) => {
		const header = within(canvas.getByRole("banner"));
		const lockup = header.getByRole("link", {
			name: "Larkmoor Studio × Kestrel Hollow Bakehouse home",
		});
		await expect(lockup).toHaveAttribute("href", "https://studio.example.com");
		await expect(
			within(lockup).getByRole("img", { name: "Kestrel Hollow Bakehouse" }),
		).toBeVisible();
		const nav = within(header.getByRole("navigation", { name: "Page sections" }));
		await expect(nav.getByRole("link", { name: "At a glance" })).toHaveAttribute("href", "#glance");
		await expect(header.queryByRole("link", { name: /Order|Book|Call/ })).toBeNull();
		await expect(canvas.getByRole("main")).toHaveAttribute("id", "main");
		await expect(canvas.getByText(/© \d{4} Larkmoor Studio/)).toBeVisible();
	},
};

/** The skip link is the first stop and lands on the page. */
export const SkipToThePage: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.tab();
		const skip = canvas.getByRole("link", { name: /Skip to/ });
		await expect(skip).toHaveFocus();
		await expect(skip).toHaveAttribute("href", "#main");
	},
};

/**
 * Pinned to the comfortable spacing whatever density the toolbar asks for:
 * the shell's root resolves the comfortable `--section-space`.
 */
export const DensityPinnedComfortable: Story = {
	globals: { ...pin("desktop"), density: "compact" },
	play: async ({ canvasElement }) => {
		const root = canvasElement.querySelector(".atelic-ui") as HTMLElement;
		const space = getComputedStyle(root).getPropertyValue("--section-space");
		await expect(space).toBe(sectionSpace("comfortable"));
		await expect(space).not.toBe(sectionSpace("compact"));
	},
};

/**
 * The header mark's height. A theme sets `--brand-mark-height` (here 40px)
 * and the mark should follow it; the artifact sheet pins it at 20px instead
 * (stories/findings/chrome.md, `artifact-sheet-mark-height`).
 */
export const MarkHeight: Story = {
	tags: ["known-issue"],
	decorators: [
		(Story) => (
			<>
				<style>{".atelic-ui { --brand-mark-height: 40px; }"}</style>
				<Story />
			</>
		),
	],
	play: async ({ canvas }) => {
		// The sender's mark is decoration inside the named lockup, reached from it.
		const lockup = within(canvas.getByRole("banner")).getByRole("link", { name: /home$/ });
		const mark = lockup.querySelector("img") as HTMLImageElement;
		await waitFor(() => expect(mark.complete).toBe(true));
		await knownBug("artifact-sheet-mark-height", async () => {
			await expect(Math.round(mark.getBoundingClientRect().height)).toBe(40);
		});
	},
};

/** No recipient mark: the sender's lockup alone. */
export const SenderAlone: Story = {
	args: { site: { ...artifactSite, recipient: { name: "Kestrel Hollow Bakehouse" } } },
	play: async ({ canvas }) => {
		const header = within(canvas.getByRole("banner"));
		await expect(header.getByRole("link", { name: "Larkmoor Studio home" })).toBeVisible();
		await expect(header.queryByRole("img", { name: "Kestrel Hollow Bakehouse" })).toBeNull();
	},
};

/** No stops: the header carries the lockup alone. */
export const NoStops: Story = {
	args: { stops: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("navigation", { name: "Page sections" })).toBeNull();
	},
};

/** Behind the gate: the watermark names the signed in reader. */
export const BehindTheGate: Story = {
	beforeEach: () => {
		// biome-ignore lint/suspicious/noDocumentCookie: the watermark reads document.cookie, so the story writes it the same way
		document.cookie = "gate_email=rosa%40quillandfern.example.com; path=/";
		return () => {
			// biome-ignore lint/suspicious/noDocumentCookie: clearing the cookie the story set
			document.cookie = "gate_email=; path=/; max-age=0";
		};
	},
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText("rosa@quillandfern.example.com")).toBeInTheDocument(),
		);
	},
};

/** On a phone the header, the page, and the closing bar stay inside the screen. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
