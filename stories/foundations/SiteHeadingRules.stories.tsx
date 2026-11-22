import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Footer, type FooterColumn } from "../../src/chrome";
import { LocationSection, ProcessSteps } from "../../src/sections";
import { address, email, phone, site, wordmarkBrand } from "../fixtures/bakery";
import { processSteps } from "../fixtures/sections";
import { pin } from "../support/viewports";

const columns: FooterColumn[] = [
	{ heading: "Company", links: [{ label: "Our story", href: "/about" }] },
	{ heading: "Legal", links: [{ label: "Privacy", href: "/privacy" }] },
];

/**
 * A site's own bare heading rule, unlayered as every rule in a site's
 * sheets is, so it beats any rule inside the package's layer whatever that
 * rule's weight. Written for a page's section titles, it must never reach
 * the small labels a component sets as headings.
 */
const SITE_RULE = `h2, h3, h4 {
	font-family: Georgia, serif;
	font-size: 64px;
	line-height: 2;
	letter-spacing: 0.3em;
	text-transform: none;
	margin: 40px 0;
	color: rgb(200, 0, 0);
}`;

const PROPERTIES = [
	"font-family",
	"font-size",
	"line-height",
	"letter-spacing",
	"text-transform",
	"margin-top",
	"margin-bottom",
	"color",
] as const;

function look(element: Element) {
	const style = getComputedStyle(element);
	return Object.fromEntries(PROPERTIES.map((name) => [name, style.getPropertyValue(name)]));
}

/**
 * A component's small headings (the footer's column labels, a process
 * step's title, a location's Hours) are headings by role, a `div` with
 * `role="heading"` and `aria-level`, never heading elements. A screen
 * reader hears a heading at its level either way; a site's bare `h2` or
 * `h3` rule reaches only an element, and no rule inside the package's layer
 * can hold off an unlayered one. The band's own title stays a real heading,
 * which the site's rule is meant to reach.
 */
const meta = {
	title: "Foundations/SiteHeadingRules",
	render: () => (
		<>
			<ProcessSteps title="How the bread is made" steps={processSteps} />
			<LocationSection site={site} title="On Alder Street" />
			<Footer
				brand={wordmarkBrand}
				address={address}
				phone={phone}
				email={email}
				columns={columns}
			/>
		</>
	),
	globals: pin("desktop"),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeldAgainstABareRule: Story = {
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		const labels = [
			canvas.getByRole("heading", { level: 3, name: "Mix at night" }),
			canvas.getByRole("heading", { level: 3, name: "Hours" }),
			canvas.getByRole("heading", { level: 2, name: "Company" }),
			canvas.getByRole("heading", { level: 2, name: "Legal" }),
		];
		const title = canvas.getByRole("heading", { level: 2, name: "How the bread is made" });

		const before = labels.map(look);
		const sheet = document.createElement("style");
		sheet.textContent = SITE_RULE;
		document.head.append(sheet);
		try {
			await step("the site's bare rule reaches the band's real title", async () => {
				await expect(getComputedStyle(title).fontSize).toBe("64px");
			});
			await step("and leaves every label looking exactly as it did", async () => {
				await expect(labels.map(look)).toEqual(before);
			});
		} finally {
			sheet.remove();
		}
		await step("each label is a heading by role, its band's title a heading element", async () => {
			await expect(title.tagName).toBe("H2");
			for (const label of labels) await expect(label.tagName).toBe("DIV");
		});
	},
};
