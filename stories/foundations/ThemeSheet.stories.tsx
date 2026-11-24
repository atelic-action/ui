import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

/**
 * The proof that the package's own theme sheet (`src/styles/theme.css`)
 * carries the practice's palette, and that a site's theme still wins over
 * it. Storybook imports the sheet globally (preview.tsx), after the
 * component sheets and before the fonts, as a site that wears the
 * practice's look does, so these checks read what every other story wears.
 *
 * The sheet sits in `@layer atelic-ui-theme`, named after `atelic-ui`, so it
 * outranks the defaults the component sheets declare, and an unlayered
 * `.atelic-ui` rule a site writes outranks it whether it loads before the
 * sheet or after. The override is added only for the length of one check,
 * never rendered, so it cannot reach the other story on the docs page.
 */
const SWATCHES = [
	"--surface",
	"--surface-alt",
	"--surface-inset",
	"--surface-dark",
	"--card",
	"--ink",
	"--primary",
	"--primary-fill",
	"--primary-ink",
];

const meta = {
	title: "Foundations/ThemeSheet",
	parameters: { layout: "padded" },
	render: () => (
		<div>
			<ul
				style={{
					listStyle: "none",
					padding: 0,
					margin: "0 0 24px",
					display: "grid",
					gap: 8,
				}}
			>
				{SWATCHES.map((token) => (
					<li key={token} style={{ display: "flex", alignItems: "center", gap: 12 }}>
						<span
							aria-hidden="true"
							data-swatch={token}
							style={{
								width: 40,
								height: 24,
								borderRadius: "var(--radius-sm)",
								border: "1px solid var(--hairline-strong)",
								background: `var(${token})`,
							}}
						/>
						<code style={{ color: "var(--ink)" }}>{token}</code>
					</li>
				))}
			</ul>
			<a className="btn btn-primary" href="/order">
				Order ahead
			</a>
		</div>
	),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A token's value as the element resolves it. */
function token(element: Element, name: string): string {
	return getComputedStyle(element).getPropertyValue(name).trim();
}

/** Adds a sheet to the head, at its start or its end, for the length of one check. */
function withSheet<T>(css: string, at: "first" | "last", check: () => T): T {
	const style = document.createElement("style");
	style.textContent = css;
	if (at === "first") document.head.prepend(style);
	else document.head.append(style);
	try {
		return check();
	} finally {
		style.remove();
	}
}

/** The `.atelic-ui` rules that set a token, by the layer they sit in ("" for none). */
function rulesSetting(name: string): string[] {
	const layers: string[] = [];
	const walk = (rules: CSSRuleList, layer: string) => {
		for (const rule of Array.from(rules)) {
			if (rule instanceof CSSLayerBlockRule) walk(rule.cssRules, rule.name);
			else if (
				rule instanceof CSSStyleRule &&
				rule.selectorText === ".atelic-ui" &&
				rule.style.getPropertyValue(name) !== ""
			)
				layers.push(layer);
		}
	};
	for (const sheet of Array.from(document.styleSheets)) {
		try {
			walk(sheet.cssRules, "");
		} catch {}
	}
	return layers;
}

export const SheetAlone: Story = {
	play: async ({ canvas, step }) => {
		const button = canvas.getByRole("link", { name: "Order ahead" });
		const root = button.closest(".atelic-ui") as HTMLElement;

		await step("the primary comes from the package's sheet, in its own layer", async () => {
			await expect(token(root, "--primary")).toBe("#fc4a1a");
			await expect(rulesSetting("--primary")).toEqual(["atelic-ui-theme"]);
		});

		await step("the theme layer outranks the component sheets' defaults", async () => {
			// defaults.css declares --shadow-md in plain black; the theme's is in the ink's tint.
			await expect(token(root, "--shadow-md")).toContain("rgba(21, 21, 21, 0.08)");
		});

		await step("the components paint with it", async () => {
			// .btn-primary fills with --primary-fill, #d63a10 in the theme.
			await expect(getComputedStyle(button).backgroundColor).toBe("rgb(214, 58, 16)");
			const swatch = canvas
				.getByText("--primary", { selector: "code" })
				.parentElement?.querySelector("[data-swatch]") as HTMLElement;
			await expect(getComputedStyle(swatch).backgroundColor).toBe("rgb(252, 74, 26)");
		});
	},
};

export const SiteOverride: Story = {
	play: async ({ canvas, step }) => {
		const root = canvas
			.getByRole("link", { name: "Order ahead" })
			.closest(".atelic-ui") as HTMLElement;
		const override = ".atelic-ui { --primary: #123456; }";

		await step("a site's unlayered rule, loaded after the sheet, wins", async () => {
			const primary = withSheet(override, "last", () => token(root, "--primary"));
			await expect(primary).toBe("#123456");
		});

		await step("and wins loaded before it too, by the layer alone", async () => {
			const primary = withSheet(override, "first", () => token(root, "--primary"));
			await expect(primary).toBe("#123456");
		});

		await step("the tokens the site leaves alone stay the practice's", async () => {
			const surface = withSheet(override, "first", () => token(root, "--surface"));
			await expect(surface).toBe("#f6f1e7");
		});

		await step("with the override gone, the practice's primary is back", async () => {
			await expect(token(root, "--primary")).toBe("#fc4a1a");
		});
	},
};
