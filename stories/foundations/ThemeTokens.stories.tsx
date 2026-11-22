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
 * The tokens 8.1.0 and 8.2.0 add so a brand's look needs no site rules: the
 * headline's case, weight, tracking, and color, and the smaller headings'
 * tracking; the hero's eyebrow and lead; a feature card's title; the
 * callout panel's case, line face, and line's case and tracking; the proof
 * strip's stars; the footer's mark height, contact weight, and links; the
 * closing bar's links; and a link column's least width. Every token
 * defaults to the look before it, and the headline color never reaches a
 * heading on a filled or dark ground, a site's own band saying so by
 * `data-ground` included.
 */
function Page({ tokens }: { tokens?: Record<string, string> }) {
	return (
		<div style={tokens as CSSProperties}>
			<Hero
				layout="split"
				eyebrow="Alder Street, since 2014"
				title="Bread worth the early line."
				subtitle="Country loaves and morning buns, out of the oven by seven."
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
			{/* A site's own dark band, saying so by data-ground alone. */}
			<section
				className="section"
				data-ground="dark"
				style={{ background: "var(--surface-dark)", color: "var(--on-dark)" }}
			>
				<div className="wrap">
					<h2>A site's own dark band</h2>
					<h3>Out of the oven</h3>
					<h4>Fresh at seven</h4>
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
				columns={[{ heading: "Company", links: [{ label: "Wholesale", href: "/wholesale" }] }]}
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
		ownBand: canvas.getByRole("heading", { name: "A site's own dark band" }),
		small: canvas.getByRole("heading", { name: "Fresh at seven", level: 4 }),
		kicker: canvas.getByText("Alder Street, since 2014"),
		lead: canvas.getByText(/out of the oven by seven/),
		footerLink: canvas.getByRole("link", { name: "Wholesale" }),
		credit: canvas.getByRole("link", { name: /Atelic/ }),
	};
}

/** A computed length in pixels, a tracking of none ("normal") as 0. */
const px = (value: string) => (value === "normal" ? 0 : Number.parseFloat(value));

/** Checks two lengths in pixels agree to a hundredth of a pixel. */
async function expectPixels(actual: string, expected: number) {
	await expect(Math.abs(px(actual) - expected)).toBeLessThan(0.01);
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
		// 8.2.0: the smaller headings' tracking, as it was.
		await expectPixels(style(p.cardTitle).letterSpacing, px(style(p.cardTitle).fontSize) * -0.015);
		await expectPixels(style(p.small).letterSpacing, px(style(p.small).fontSize) * -0.01);
		// The hero's eyebrow is the eyebrow's own look, and its lead its old size.
		await expect(style(p.kicker).fontWeight).toBe("500");
		await expectPixels(style(p.kicker).fontSize, 0.74 * 16);
		await expectPixels(style(p.kicker).letterSpacing, 0.74 * 16 * 0.18);
		// clamp(1.05rem, 2.2vw, 1.35rem) at 1280 is the cap.
		await expectPixels(style(p.lead).fontSize, 1.35 * 16);
		await expect(style(p.calloutSub).textTransform).toBe("none");
		await expect(style(p.calloutSub).letterSpacing).toBe("normal");
		// The footer's links and the closing bar's read the neutrals they always did.
		const root = p.footerLink.closest(".atelic-ui") as Element;
		const probe = document.createElement("span");
		root.append(probe);
		probe.style.color = "var(--neutral-200)";
		await expect(style(p.footerLink).color).toBe(style(probe).color);
		probe.style.color = "var(--neutral-300)";
		await expect(style(p.credit).color).toBe(style(probe).color);
		probe.remove();
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
	"--subheading-tracking": "0em",
	"--hero-kicker-weight": "700",
	"--hero-kicker-tracking": "0.08em",
	"--hero-kicker-size": "13px",
	"--hero-lead-size": "17px",
	"--callout-sub-transform": "uppercase",
	"--callout-sub-tracking": "0.02em",
	"--footer-link": "rgb(240, 230, 200)",
	"--footer-link-hover": "rgb(255, 250, 235)",
	"--closing-link": "rgb(240, 230, 200)",
	"--closing-link-hover": "rgb(255, 250, 235)",
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
			for (const heading of [p.hero, p.dark, p.process, p.ownBand]) {
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
		await step(
			"8.2.0: the smaller headings, the hero's eyebrow and lead, the callout's line",
			async () => {
				await expectPixels(style(p.cardTitle).letterSpacing, 0);
				await expectPixels(style(p.small).letterSpacing, 0);
				await expect(style(p.kicker).fontWeight).toBe("700");
				await expect(style(p.kicker).fontSize).toBe("13px");
				await expectPixels(style(p.kicker).letterSpacing, 13 * 0.08);
				await expect(style(p.lead).fontSize).toBe("17px");
				await expect(style(p.calloutSub).textTransform).toBe("uppercase");
				await expectPixels(
					style(p.calloutSub).letterSpacing,
					px(style(p.calloutSub).fontSize) * 0.02,
				);
			},
		);
		await step("8.2.0: the footer's links and the closing bar's", async () => {
			await expect(style(p.footerLink).color).toBe("rgb(240, 230, 200)");
			await expect(style(p.credit).color).toBe("rgb(240, 230, 200)");
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

/**
 * A band that restates `--primary` on a plain element (not a theme root):
 * the proof strip's stars inside it take the band's primary, since
 * `--proof-star-fill` falls back to `--primary` where it is read.
 */
export const BandRestatingPrimary: Story = {
	args: {},
	render: () => (
		<div style={{ "--primary": "rgb(30, 77, 43)" } as CSSProperties}>
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
		</div>
	),
	play: async ({ canvas }) => {
		const star = canvas.getByRole("img", { name: /5 out of 5/ });
		await expect(getComputedStyle(star).color).toBe("rgb(30, 77, 43)");
	},
};

/**
 * The heading color steps aside on `data-ground="dark"` and `"primary"` only,
 * and on markup that carries one of the dark sections' classes without the
 * attribute, as 8.1.0 matched them; another `data-ground` value keeps the
 * brand's color.
 */
export const GroundsAndClasses: Story = {
	args: {},
	render: () => (
		<div style={BRAND as CSSProperties}>
			<div className="callout-panel">
				<h2>A callout panel by its class alone</h2>
			</div>
			<section className="section" data-ground="paper">
				<div className="wrap">
					<h2>A ground of another kind</h2>
				</div>
			</section>
		</div>
	),
	play: async ({ canvas }) => {
		const color = (name: string) => getComputedStyle(canvas.getByRole("heading", { name })).color;
		await expect(color("A callout panel by its class alone")).not.toBe("rgb(20, 70, 40)");
		await expect(color("A ground of another kind")).toBe("rgb(20, 70, 40)");
	},
};

/**
 * The hero's lead measure and the gap between its kicker, headline, lead,
 * and actions: unset, the split hero keeps 52ch and its 12, 22, and 26px;
 * set, one measure and one gap.
 */
export const HeroMeasureAndGap: Story = {
	args: {},
	render: (_args, { parameters }) => (
		<div style={parameters.tokens as CSSProperties}>
			<Hero
				layout="split"
				eyebrow="Alder Street, since 2014"
				title="Bread worth the early line."
				subtitle="Country loaves and morning buns, out of the oven by seven."
				primaryCTA={{ label: "Order ahead", href: "/order" }}
				image={{ src: image("ovens"), alt: "The ovens at dawn" }}
			/>
		</div>
	),
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { name: "Bread worth the early line." });
		const lead = canvas.getByText(/out of the oven by seven/);
		const actions = canvas.getByRole("link", { name: /Order ahead/ }).parentElement as HTMLElement;
		const ch = (element: Element) => {
			const probe = document.createElement("span");
			probe.style.cssText = "position:absolute;visibility:hidden;width:52ch";
			element.append(probe);
			const width = probe.getBoundingClientRect().width;
			probe.remove();
			return width;
		};
		await expect(
			Math.abs(Number.parseFloat(getComputedStyle(lead).maxWidth) - ch(lead)),
		).toBeLessThan(1);
		await expect(getComputedStyle(title).marginTop).toBe("12px");
		await expect(getComputedStyle(lead).marginTop).toBe("22px");
		await expect(getComputedStyle(actions).marginTop).toBe("26px");
	},
};

/** The same hero with `--hero-lead-measure` and `--hero-stack-gap` set. */
export const HeroMeasureAndGapSet: Story = {
	...HeroMeasureAndGap,
	parameters: { tokens: { "--hero-lead-measure": "30ch", "--hero-stack-gap": "16px" } },
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { name: "Bread worth the early line." });
		const lead = canvas.getByText(/out of the oven by seven/);
		const actions = canvas.getByRole("link", { name: /Order ahead/ }).parentElement as HTMLElement;
		await expect(getComputedStyle(lead).maxWidth).not.toBe("none");
		await expect(getComputedStyle(title).marginTop).toBe("16px");
		await expect(getComputedStyle(lead).marginTop).toBe("16px");
		await expect(getComputedStyle(actions).marginTop).toBe("16px");
	},
};

/**
 * Each of the split hero's gaps set on its own, as a design spaces them
 * (12px kicker to headline, 14px headline to lead, 24px lead to actions),
 * winning over `--hero-stack-gap`; the lead's leading and the copy column's
 * top and bottom padding set too. Every gap lands at its value, measured
 * between the boxes.
 */
export const HeroGapsEachSet: Story = {
	...HeroMeasureAndGap,
	parameters: {
		tokens: {
			"--hero-stack-gap": "40px",
			"--hero-gap-kicker": "12px",
			"--hero-gap-lead": "14px",
			"--hero-gap-actions": "24px",
			"--hero-lead-leading": "1.4",
			"--hero-split-pad-block": "48px",
		},
	},
	play: async ({ canvas }) => {
		const kicker = canvas.getByText("Alder Street, since 2014");
		const title = canvas.getByRole("heading", { name: "Bread worth the early line." });
		const lead = canvas.getByText(/out of the oven by seven/);
		const actions = canvas.getByRole("link", { name: /Order ahead/ }).parentElement as HTMLElement;
		const box = (element: Element) => element.getBoundingClientRect();
		// The kicker is inline in its line box, so its gap is read as the headline's margin.
		await expect(getComputedStyle(title).marginTop).toBe("12px");
		await expect(box(title).top).toBeGreaterThan(box(kicker).bottom);
		await expect(Math.round(box(lead).top - box(title).bottom)).toBe(14);
		await expect(Math.round(box(actions).top - box(lead).bottom)).toBe(24);
		await expect(
			Number.parseFloat(getComputedStyle(lead).lineHeight) /
				Number.parseFloat(getComputedStyle(lead).fontSize),
		).toBeCloseTo(1.4, 2);
		// The copy column holds the stack; its padding is the column's own.
		const column = title.parentElement as HTMLElement;
		await expect(getComputedStyle(column).paddingTop).toBe("48px");
		await expect(getComputedStyle(column).paddingBottom).toBe("48px");
	},
};

/** Unset, the lead's leading is 1.55 and the column's padding the section's space, as before. */
export const HeroLeadingAndPaddingDefaults: Story = {
	...HeroMeasureAndGap,
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { name: "Bread worth the early line." });
		const lead = canvas.getByText(/out of the oven by seven/);
		await expect(
			Number.parseFloat(getComputedStyle(lead).lineHeight) /
				Number.parseFloat(getComputedStyle(lead).fontSize),
		).toBeCloseTo(1.55, 2);
		const column = title.parentElement as HTMLElement;
		const probe = document.createElement("div");
		probe.style.paddingTop = "var(--section-space)";
		column.append(probe);
		await expect(getComputedStyle(column).paddingTop).toBe(getComputedStyle(probe).paddingTop);
		probe.remove();
	},
};
