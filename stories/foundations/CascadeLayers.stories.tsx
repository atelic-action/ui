import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

/**
 * The proof that the stories cascade the way a site and an app do. Every
 * package sheet sits in `@layer atelic-ui`, and a layer ranks by where it is
 * first named, so `.storybook/preview-head.html` names the order before any
 * sheet loads. These checks fail if the head line goes missing or moves, or
 * if Storybook ever injects a layered sheet ahead of it.
 */
const meta = {
	title: "Foundations/CascadeLayers",
	parameters: { layout: "padded" },
	render: () => (
		<a className="btn btn-dark layer-proof" href="/order">
			Order ahead
		</a>
	),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ORDER = [
	"properties",
	"theme",
	"base",
	"atelic-ui",
	"atelic-ui-theme",
	"components",
	"utilities",
];

/** The first layer rule the document meets, in sheet order. */
function firstLayerRule(): CSSRule | undefined {
	for (const sheet of Array.from(document.styleSheets)) {
		let rules: CSSRuleList;
		try {
			rules = sheet.cssRules;
		} catch {
			continue;
		}
		for (const rule of Array.from(rules)) {
			if (rule instanceof CSSLayerStatementRule || rule instanceof CSSLayerBlockRule) return rule;
		}
	}
	return undefined;
}

/** Adds a sheet at the end of the head for the length of one check. */
function withSheet<T>(css: string, check: () => T): T {
	const style = document.createElement("style");
	style.textContent = css;
	document.head.append(style);
	try {
		return check();
	} finally {
		style.remove();
	}
}

export const LayerOrder: Story = {
	play: async ({ canvas, step }) => {
		const specimen = canvas.getByRole("link", { name: "Order ahead" });

		await step("the order is named before any layered sheet", async () => {
			const rule = firstLayerRule();
			await expect(rule).toBeInstanceOf(CSSLayerStatementRule);
			await expect(Array.from((rule as CSSLayerStatementRule).nameList)).toEqual(ORDER);
		});

		await step(
			"the package outranks Tailwind's reset, even when the reset loads later",
			async () => {
				const padding = withSheet(
					"@layer base { .atelic-ui .layer-proof { padding: 0px; } }",
					() => getComputedStyle(specimen).paddingTop,
				);
				await expect(padding).not.toBe("0px");
			},
		);

		await step("an app's utilities outrank the package", async () => {
			const padding = withSheet(
				"@layer utilities { .atelic-ui .layer-proof { padding-top: 3px; } }",
				() => getComputedStyle(specimen).paddingTop,
			);
			await expect(padding).toBe("3px");
		});

		await step("an unlayered rule wins with less specificity", async () => {
			// `.layer-proof` alone is weaker than the package's `.atelic-ui .btn`.
			const radius = withSheet(
				".layer-proof { border-radius: 5px; }",
				() => getComputedStyle(specimen).borderTopLeftRadius,
			);
			await expect(radius).toBe("5px");
		});

		await step(
			"the package's theme sheet, in its own layer after the package's, sets the tokens they read",
			async () => {
				const root = specimen.closest(".atelic-ui") as HTMLElement;
				await expect(getComputedStyle(root).getPropertyValue("--primary").trim()).toBe("#fc4a1a");
				// `.btn-dark` paints with `var(--ink)` from the theme.
				await expect(getComputedStyle(specimen).backgroundColor).toBe("rgb(21, 21, 21)");
			},
		);
	},
};
