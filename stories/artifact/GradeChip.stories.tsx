import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { GradeChip, gradeLabel, type WriteupGrade } from "../../src/artifact";

/**
 * A section's grade, A to D, as a chip in its grade's color. The letter is
 * the chip's text, so the grade is never told by color alone.
 */
const meta = {
	title: "Artifact/GradeChip",
	component: GradeChip,
	parameters: { layout: "padded" },
	args: { grade: "a" },
} satisfies Meta<typeof GradeChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const A: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText("A")).toBeVisible();
	},
};

export const B: Story = { args: { grade: "b" } };

export const C: Story = { args: { grade: "c" } };

export const D: Story = { args: { grade: "d" } };

const sections: Array<{ grade: WriteupGrade; section: string }> = [
	{ grade: "a", section: "Local SEO" },
	{ grade: "b", section: "Technical SEO" },
	{ grade: "c", section: "Core Web Vitals" },
	{ grade: "d", section: "Conversion" },
];

/** The four beside their sections, the way a read lists them; each chip's text is its letter. */
export const BesideSections: Story = {
	render: () => (
		<ul style={{ display: "grid", gap: 8 }}>
			{sections.map(({ grade, section }) => (
				<li key={grade} style={{ display: "flex", gap: 10, alignItems: "center" }}>
					<GradeChip grade={grade} />
					{section}
				</li>
			))}
		</ul>
	),
	play: async ({ canvas }) => {
		const rows = canvas.getAllByRole("listitem");
		await expect(rows.map((row) => row.textContent)).toEqual(
			sections.map(({ grade, section }) => `${gradeLabel[grade]}${section}`),
		);
	},
};
