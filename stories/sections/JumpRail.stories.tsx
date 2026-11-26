import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { JumpRail } from "../../src/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const stops = [
	{ id: "bread", label: "Bread" },
	{ id: "pastry", label: "Pastry" },
	{ id: "cakes", label: "Cakes" },
	{ id: "wholesale", label: "Wholesale" },
];

/** A screen of page under each stop, so the rail has somewhere to scroll. */
function Page({ children }: { children: React.ReactNode }) {
	return (
		<main>
			<h1 style={{ padding: "24px var(--gutter)" }}>The menu</h1>
			{children}
			{stops.map((stop) => (
				<section key={stop.id} id={stop.id} aria-label={stop.label} style={{ minHeight: "100vh" }}>
					<div className="wrap">
						<h2>{stop.label}</h2>
					</div>
				</section>
			))}
		</main>
	);
}

/**
 * Gives a long page a sticky row of tabs that scroll to its sections. The
 * sticky in page navigation: a tab per section, the one in the reading band
 * marked by scroll.
 */
const meta = {
	title: "Sections/JumpRail",
	component: JumpRail,
	args: { items: stops, ariaLabel: "Menu sections" },
	decorators: [
		(Story) => (
			<Page>
				<Story />
			</Page>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof JumpRail>;

export default meta;
type Story = StoryObj<typeof meta>;

const rail = (canvas: ReturnType<typeof within>) =>
	within(canvas.getByRole("navigation", { name: "Menu sections" }));

const color = (element: Element) => getComputedStyle(element).color;

const scrollToStop = (id: string) => {
	const top = (document.getElementById(id) as HTMLElement).getBoundingClientRect().top;
	window.scrollTo({ top: window.scrollY + top - 100, behavior: "instant" });
};

/**
 * Each tab jumps to its section, the marked tab follows the scroll down the
 * page and back, and the rail sticks under the header the whole way.
 */
export const FollowsScroll: Story = {
	play: async ({ canvas, step }) => {
		const tab = (name: string) => rail(canvas).getByRole("link", { name });
		await step("a tab per stop, each an in page jump", async () => {
			await expect(rail(canvas).getAllByRole("link")).toHaveLength(4);
			await expect(tab("Cakes")).toHaveAttribute("href", "#cakes");
		});
		await step("scrolled to Pastry, the Pastry tab is the marked one", async () => {
			const resting = color(tab("Pastry"));
			scrollToStop("pastry");
			await waitFor(() => expect(color(tab("Pastry"))).not.toBe(resting));
			await expect(color(tab("Bread"))).toBe(resting);
		});
		await step("further down, the mark moves to Wholesale", async () => {
			const resting = color(tab("Cakes"));
			scrollToStop("wholesale");
			await waitFor(() => expect(color(tab("Wholesale"))).not.toBe(resting));
			await waitFor(() => expect(color(tab("Pastry"))).toBe(resting));
		});
		await step("back up, it returns to Bread", async () => {
			const resting = color(tab("Cakes"));
			scrollToStop("bread");
			await waitFor(() => expect(color(tab("Bread"))).not.toBe(resting));
		});
		await step("the rail stuck under the header all the way", async () => {
			const top = canvas
				.getByRole("navigation", { name: "Menu sections" })
				.getBoundingClientRect().top;
			await expect(Math.round(top)).toBe(68);
		});
		// The mark is color alone: nothing tells a screen reader which tab is current.
		await step("the marked tab says it is the current one", async () => {
			await expect(tab("Bread")).toHaveAttribute("aria-current", "location");
		});
	},
};

/** The default name, when a page names none. */
export const DefaultName: Story = {
	args: { ariaLabel: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("navigation", { name: "Page sections" })).toBeVisible();
	},
};

/** Many stops on a phone: the rail scrolls sideways inside itself, never the page. */
export const ManyStopsPhone: Story = {
	globals: pin("phone"),
	args: {
		items: [
			...stops,
			{ id: "bread", label: "Seasonal tarts and the holiday bake" },
			{ id: "cakes", label: "Allergens and ingredients" },
		].map((stop, i) => ({ ...stop, id: i < 4 ? stop.id : `${stop.id}-${i}` })),
	},
	play: async ({ canvas }) => {
		const links = rail(canvas).getAllByRole("link");
		const last = links[links.length - 1].getBoundingClientRect();
		await expect(last.right).toBeGreaterThan(window.innerWidth);
		await expectNoSidewaysScroll();
	},
};
