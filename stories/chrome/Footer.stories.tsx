import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Footer, type FooterColumn } from "../../src/chrome";
import { address, brand, email, phone, site, wordmarkBrand } from "../fixtures/bakery";
import { pin } from "../support/viewports";

/** The default footer's four columns, as SiteShell derives them from the bakery's config. */
const columns: FooterColumn[] = [
	{ heading: "Company", links: site.nav.map((item) => ({ label: item.label, href: item.to })) },
	{ heading: "Resources", links: site.footerLinks ?? [] },
	{
		heading: "Social",
		links: (site.socialLinks ?? []).map((link) => ({ ...link, external: true })),
	},
	{ heading: "Legal", links: site.legalLinks ?? [] },
];

/** The one footer shape every site wears (README, The Default Footer). */
const meta = {
	title: "Chrome/Footer",
	component: Footer,
	args: {
		brand: wordmarkBrand,
		rating: "4.9 on Google",
		address,
		addressHref: "https://maps.example.com/?q=418+Alder+Street",
		phone,
		email,
		columns,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, step }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		await step("the brand column: the rating as text, the NAP as links", async () => {
			const rating = footer.getByText("4.9 on Google");
			await expect(rating.closest("a")).toBeNull();
			const place = footer.getByRole("link", { name: /418 Alder Street/ });
			await expect(place).toHaveAttribute("href", "https://maps.example.com/?q=418+Alder+Street");
			await expect(place).toHaveAttribute("target", "_blank");
			await expect(footer.getByRole("link", { name: phone.display })).toHaveAttribute(
				"href",
				`tel:${phone.e164}`,
			);
			const mail = footer.getByRole("link", { name: email });
			await expect(mail).toHaveAttribute("href", `mailto:${email}`);
			await expect(mail).not.toHaveAttribute("target");
		});
		await step("four link columns in order, each a named nav", async () => {
			const names = footer.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
			await expect(names).toEqual(["Company", "Resources", "Social", "Legal"]);
			await expect(footer.getByRole("link", { name: "Instagram" })).toHaveAttribute(
				"target",
				"_blank",
			);
		});
		await step("the brand column and the four columns share one row", async () => {
			const tops = [footer.getByText("kestrel hollow"), ...footer.getAllByRole("navigation")].map(
				(element) => Math.round(element.getBoundingClientRect().top),
			);
			const navTops = new Set(tops.slice(1));
			await expect(navTops.size).toBe(1);
		});
		await step("the closing bar follows, with the copyright and the credit", async () => {
			await expect(canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/)).toBeVisible();
			await expect(canvas.getByRole("link", { name: "Atelic" })).toHaveAttribute(
				"href",
				"https://atelic.me",
			);
		});
	},
};

/** On a phone the brand column takes the full width and the link columns pair up beneath it. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const footer = within(canvas.getByRole("contentinfo"));
		const [company, resources, social] = footer.getAllByRole("navigation");
		const box = (element: HTMLElement) => element.getBoundingClientRect();
		await expect(Math.round(box(company).top)).toBe(Math.round(box(resources).top));
		await expect(box(social).top).toBeGreaterThan(box(company).bottom);
		await expect(box(footer.getByText("kestrel hollow")).bottom).toBeLessThanOrEqual(
			box(company).top,
		);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** A column with no links is left out, and the grid sizes itself to the columns shown. */
export const EmptyColumnLeftOut: Story = {
	args: {
		columns: columns.map((column) =>
			column.heading === "Resources" ? { ...column, links: [] } : column,
		),
	},
	play: async ({ canvas }) => {
		const navs = within(canvas.getByRole("contentinfo")).getAllByRole("navigation");
		await expect(navs.map((nav) => nav.getAttribute("aria-label"))).toEqual([
			"Company",
			"Social",
			"Legal",
		]);
	},
};

/** A service area business with no storefront: the phone and the email stand alone. */
export const NoAddress: Story = {
	args: { address: undefined, addressHref: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link", { name: /Alder Street/ })).toBeNull();
		await expect(canvas.getByRole("link", { name: phone.display })).toBeVisible();
	},
};

/** The mark as a picture in place of the wordmark. */
export const ImageLogo: Story = {
	args: {
		brand: { ...brand, logo: { src: "/images/kestrel-mark-light.svg", alt: "Kestrel Hollow" } },
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Kestrel Hollow" })).toBeVisible();
	},
};

/** The practice's own site turns the credit off; the copyright still prints. */
export const CreditOff: Story = {
	args: { credit: false },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link", { name: "Atelic" })).toBeNull();
		await expect(canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/)).toBeVisible();
	},
};

/** A site's own note stands in the credit's place. */
export const Note: Story = {
	args: { note: "Baked in Fairhaven since 2014", attribution: "A family bakery" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Baked in Fairhaven since 2014")).toBeVisible();
		await expect(canvas.getByText(/Kestrel Hollow Bakehouse · A family bakery/)).toBeVisible();
	},
};

/** The longest realistic content: a long name, a long email, and full columns. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		brand: {
			name: "Kestrel Hollow Bakehouse and Wholesale Kitchen",
			logo: { wordmark: "kestrel hollow bakehouse" },
		},
		email: "wholesale.orders.and.catering@kestrelhollowbakehouse.example.com",
		columns: columns.map((column) => ({
			...column,
			links: [
				...column.links,
				{ label: "Standing orders for cafes and grocers", href: "/wholesale/standing" },
			],
		})),
	},
	play: async () => {
		// A long address breaks rather than pushing the page sideways on a phone.
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
