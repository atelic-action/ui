import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { SectionHeading } from "../../src/primitives";
import { LinkColumns } from "../../src/sections";
import { knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * Columns of links under a section's heading: service areas by region, here
 * with counts. The heading's eyebrow fails contrast on this theme (stories/findings/primitives.md).
 */
const meta = {
	title: "Sections/LinkColumns",
	component: LinkColumns,
	tags: ["known-issue"],
	parameters: { ...knownIssues("eyebrow-contrast") },
	args: {
		columns: [
			{
				heading: "Fairhaven",
				href: "/areas/fairhaven",
				links: [
					{ label: "Alder Street", href: "/areas/alder-street", count: "14 orders" },
					{ label: "Old Mill", href: "/areas/old-mill", count: "9" },
					{ label: "Birch Row", href: "/areas/birch-row", count: "6" },
				],
			},
			{
				heading: "Riverside",
				links: [
					{ label: "The Riverside blocks", href: "/areas/riverside", count: "11" },
					{ label: "Lantern Square", href: "/areas/lantern-square", count: "102" },
					{ label: "Ferry Landing", href: "/areas/ferry-landing" },
				],
			},
			{
				heading: "Further out",
				links: [
					{ label: "Hollow Creek", href: "/areas/hollow-creek", count: "3" },
					{ label: "The orchard roads", href: "/areas/orchards", count: "1" },
				],
			},
		],
	},
	decorators: [
		(Story) => (
			<section className="section surface-alt">
				<div className="wrap">
					<SectionHeading
						eyebrow="Where we deliver"
						title="Every morning, before the doors open"
						lead="The counts are the standing wholesale orders in each neighborhood."
					/>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof LinkColumns>;

export default meta;
type Story = StoryObj<typeof meta>;

const box = (element: Element) => element.getBoundingClientRect();

/** As many across as fit, with every count set flush right on its link's line. */
export const Default: Story = {
	play: async ({ canvas, step }) => {
		const heads = canvas.getAllByRole("heading", { level: 3 });
		await step("the three columns sit side by side", async () => {
			await expect(new Set(heads.map((head) => Math.round(box(head).top))).size).toBe(1);
		});
		await step("a heading with an href is a link", async () => {
			await expect(canvas.getByRole("link", { name: "Fairhaven" })).toHaveAttribute(
				"href",
				"/areas/fairhaven",
			);
			await expect(within(heads[1]).queryByRole("link")).toBeNull();
		});
		await step("counts sit right aligned, digit under digit, on their label's line", async () => {
			const riverside = canvas.getByRole("link", { name: /The Riverside blocks/ });
			const lantern = canvas.getByRole("link", { name: /Lantern Square/ });
			const eleven = within(riverside).getByText("11");
			const hundredTwo = within(lantern).getByText("102");
			await expect(Math.round(box(eleven).right)).toBe(Math.round(box(riverside).right));
			await expect(Math.round(box(eleven).right)).toBe(Math.round(box(hundredTwo).right));
			await expect(
				Math.abs(
					box(eleven).bottom - box(within(riverside).getByText("The Riverside blocks")).bottom,
				),
			).toBeLessThan(3);
			await expect(getComputedStyle(eleven).fontVariantNumeric).toBe("tabular-nums");
		});
		await step("a link with no count carries none", async () => {
			await expect(canvas.getByRole("link", { name: "Ferry Landing" })).toHaveTextContent(
				/^Ferry Landing$/,
			);
		});
	},
};

/** On a phone the columns stack, each keeping its counts flush right. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const heads = canvas.getAllByRole("heading", { level: 3 });
		await expect(box(heads[1]).top).toBeGreaterThan(box(heads[0]).bottom);
		const alder = canvas.getByRole("link", { name: /Alder Street/ });
		await expect(Math.round(box(within(alder).getByText("14 orders")).right)).toBe(
			Math.round(box(alder).right),
		);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** Plain links with no figures: a hub page's children. */
export const NoCounts: Story = {
	args: {
		columns: [
			{
				heading: "Bread",
				links: [
					{ label: "Country sourdough", href: "/menu/sourdough" },
					{ label: "Seeded rye", href: "/menu/rye" },
				],
			},
			{
				heading: "Pastry",
				links: [
					{ label: "Morning buns", href: "/menu/buns" },
					{ label: "Croissants", href: "/menu/croissants" },
				],
			},
		],
	},
};

/** An external link opens in a new tab; a tel link never does. */
export const External: Story = {
	args: {
		columns: [
			{
				heading: "Order",
				links: [
					{ label: "Wholesale portal", href: "https://portal.example.com", external: true },
					{ label: "Call the shop", href: "tel:+15555550142", external: true },
				],
			},
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Wholesale portal" })).toHaveAttribute(
			"target",
			"_blank",
		);
		await expect(canvas.getByRole("link", { name: "Call the shop" })).not.toHaveAttribute("target");
	},
};

/** The longest realistic labels, on a phone: a long name wraps beside its count. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		columns: [
			{
				heading: "The Riverside blocks and Ferry Landing",
				links: [
					{
						label: "The blocks between Lantern Square and the old ferry landing",
						href: "/areas/a",
						count: "102 orders",
					},
					{ label: "Hollow Creek", href: "/areas/b", count: "3" },
				],
			},
		],
	},
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
