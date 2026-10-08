/**
 * The grade a section carries: A, B, C, or D, green, yellow, orange, red, so
 * an owner reads it at a glance. The scale and the rule behind every letter
 * are the practice's FOOTPRINT.md, never restated here; D is for something
 * truly broken, and only where a section's rule names it. The monthly page
 * wears the same letters, so a later writeup and every month after read
 * against the first.
 */
export type WriteupGrade = "a" | "b" | "c" | "d";

export const gradeLabel: Record<WriteupGrade, string> = {
	a: "A",
	b: "B",
	c: "C",
	d: "D",
};

/**
 * The letter as a chip in its grade's color. The writeup and the monthly page
 * both wear it, so its styles live in the base sheet chain
 * (styles/artifact.css), never in either component's stylesheet.
 */
export function GradeChip({ grade }: { grade: WriteupGrade }) {
	return (
		<span className="op-grade" data-grade={grade}>
			{gradeLabel[grade]}
		</span>
	);
}
