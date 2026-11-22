import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect, type within } from "storybook/test";
import { Footer } from "../../src/chrome";
import { SectionHeading, StarRow } from "../../src/primitives";
import {
	CalloutPanel,
	FeatureGrid,
	Hero,
	LinkColumns,
	PageHero,
	ProcessSteps,
	ProofStrip,
} from "../../src/sections";
import { address, brand, email, phone } from "../fixtures/bakery";
import { features, image, processSteps } from "../fixtures/sections";
import { pin } from "../support/viewports";

/**
 * The tokens 8.1.0 adds so a brand's look needs no site rules: the
 * headline's case, weight, tracking, and color; a feature card's title;
 * the callout panel's case and line face; the proof strip's stars; the
 * footer's mark height and contact weight; and a link column's least
 * width. Every token defaults to the look before it, and the headline
 * color never reaches a heading on a filled or dark ground.
 */
function Page({ tokens }: { tokens?: Record<string, string> }) {
	return (
		<div style={tokens as CSSProperties}>
			<Hero
				layout="split"
				eyebrow="Alder Street, since 2014"
				title="Bread worth the early line."
				image={{ src: image("ovens"), alt: "The ovens at dawn" }}
			/>
			<PageHero eyebrow="Visit" title="The shop on Alder Street" />
			<section className="section">
				<div className="wrap">
					<SectionHeading eyebrow="Wholesale" title="Bread for the cafes in town" />
					<CalloutPanel
						items={[
							{ title: "Since 2014", subtitle: "One shop on Alder Street" },
							{ title: "11 cafes", subtitle: "Carry the morning bake" },
						]}
					/>
					<LinkColumns
						columns={[
							{ heading: "Fairhaven", links: [{ label: "Alder Street", href: "/a" }] },
							{ heading: "Riverside", links: [{ label: "Ferry Landing", href: "/b" }] },
						]}
					/>
				</div>
			</section>
			<section className="section" style={{ background: "var(--surface-dark)" }}>
				<div className="wrap">
					<SectionHeading title="On a dark band" onDark />
				</div>
			</section>
			<FeatureGrid title="Four things, done every morning" items={features} />
			<ProcessSteps title="Three steps, two days" steps={processSteps} />
			<ProofStrip
				ariaLabel="Why the line is long"
				items={[
					{
						value: (
							<>
								4.9 <StarRow rating={5} size={15} />
							</>
						),
						label: "212 reviews",
					},
				]}
			/>
			<Footer
				brand={brand}
				address={address}
				addressHref="https://maps.example.com/?q=418+Alder+Street"
				phone={phone}
				email={email}
			/>
		</div>
	);
}

const meta = {
	title: "Foundations/ThemeTokens",
	component: Page,
	globals: pin("desktop"),
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

const style = (element: Element) => getComputedStyle(element);

/** The headings the tokens reach, and the ones they must not color. */
function parts(canvas: ReturnType<typeof within>) {
	return {
		section: canvas.getByRole("heading", { name: "Bread for the cafes in town" }),
		page: canvas.getByRole("heading", { name: "The shop on Alder Street" }),
		hero: canvas.getByRole("heading", { name: "Bread worth the early line." }),
		dark: canvas.getByRole("heading", { name: "On a dark band" }),
		process: canvas.getByRole("heading", { name: "Three steps, two days" }),
		callout: canvas.getByText("Since 2014"),
		calloutSub: canvas.getByText("One shop on Alder Street"),
		cardTitle: canvas.getByRole("heading", { name: features[0]?.title, level: 3 }),
		star: canvas.getByRole("img", { name: /5 out of 5/ }),
		mark: canvas.getByText("Kestrel Hollow").closest(".footer-lockup")?.querySelector("img"),
		phoneLink: canvas.getByRole("link", { name: phone.display }),
	};
}

/** Nothing set: every token reads the look it replaced. */
export const Defaults: Story = {
	args: {},
	play: async ({ canvas }) => {
		const p = parts(canvas);
		await expect(style(p.section).textTransform).toBe("none");
		await expect(style(p.section).fontWeight).toBe("800");
		await expect(style(p.section).letterSpacing).not.toBe("normal");
		await expect(style(p.callout).textTransform).toBe("none");
		await expect(style(p.mark as Element).height).toBe("38px");
		await expect(style(p.phoneLink).fontWeight).toBe("600");
		// The page's own words and the card's title inherit the ink, as before.
		await expect(style(p.section).color).toBe(style(p.section.parentElement as Element).color);
		await expect(style(p.cardTitle).color).toBe(style(p.cardTitle.parentElement as Element).color);
	},
};

const BRAND = {
	"--heading-transform": "uppercase",
	"--heading-weight": "600",
	"--heading-tracking": "0.04em",
	"--heading-color": "rgb(20, 70, 40)",
	"--card-title-color": "rgb(20, 70, 40)",
	"--callout-transform": "uppercase",
	"--callout-sub-font": "Georgia, serif",
	"--proof-star-fill": "rgb(200, 140, 0)",
	"--footer-mark-height": "48px",
	"--footer-nap-weight": "400",
	"--link-columns-min": "120px",
};

/**
 * A brand's tokens set: the page and section headings take its case, weight,
 * tracking, and color; the hero's headline takes the case and weight but
 * keeps the field's own words; a heading on a dark band or the process band
 * keeps its light words.
 */
export const BrandTokens: Story = {
	args: { tokens: BRAND },
	play: async ({ canvas, step }) => {
		const p = parts(canvas);
		await step("the headings take the brand's case, weight, tracking, and color", async () => {
			for (const heading of [p.section, p.page]) {
				await expect(style(heading).textTransform).toBe("uppercase");
				await expect(style(heading).fontWeight).toBe("600");
				await expect(style(heading).color).toBe("rgb(20, 70, 40)");
			}
			await expect(style(p.hero).textTransform).toBe("uppercase");
		});
		await step("a heading on a filled or dark ground keeps its own words", async () => {
			for (const heading of [p.hero, p.dark, p.process]) {
				await expect(style(heading).color).not.toBe("rgb(20, 70, 40)");
			}
		});
		await step("the card, the callout, the stars, the footer, and the columns", async () => {
			await expect(style(p.cardTitle).color).toBe("rgb(20, 70, 40)");
			await expect(style(p.callout).textTransform).toBe("uppercase");
			await expect(style(p.calloutSub).fontFamily).toContain("Georgia");
			await expect(style(p.star).color).toBe("rgb(200, 140, 0)");
			await expect(style(p.mark as Element).height).toBe("48px");
			await expect(style(p.phoneLink).fontWeight).toBe("400");
		});
	},
};

/**
 * A least column width of 120px fits two columns across a phone, where the
 * default 170px stacks them.
 */
export const LinkColumnsTwoAcrossAPhone: Story = {
	args: { tokens: { "--link-columns-min": "120px" } },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const heads = ["Fairhaven", "Riverside"].map((name) =>
			canvas.getByRole("heading", { name, level: 3 }),
		);
		const [a, b] = heads.map((head) => Math.round(head.getBoundingClientRect().top));
		await expect(a).toBe(b);
	},
};

/** The default least width stacks the two columns on a phone, as before. */
export const LinkColumnsDefaultPhone: Story = {
	args: {},
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const [a, b] = ["Fairhaven", "Riverside"].map(
			(name) => canvas.getByRole("heading", { name, level: 3 }).getBoundingClientRect().top,
		);
		await expect(b as number).toBeGreaterThan(a as number);
	},
};
