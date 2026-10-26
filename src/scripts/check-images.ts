/**
 * Fails the build when a photo in public/images is over the house budget or
 * ships as JPEG where WebP belongs. The rule is template-marketing's CLAUDE.md,
 * Image budget: every photo ships as WebP at quality about 75, sized to about
 * 2x its rendered width, and the Open Graph cards alone stay JPEG, because
 * some link previews still will not read WebP. A card is any JPEG whose file
 * name is `og` or ends in `-og`.
 *
 * Usage: atelic-check-images   (from the site's root)
 * Exits 1 on any problem.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/** Where a site keeps the images it serves, from the site's root. */
export const IMAGES_ROOT = "public/images";

/** The most any one image may weigh, in bytes. */
export const IMAGE_BUDGET = 250 * 1024;

/** A PNG past this is a photo saved in the wrong format; a mark or a logo is far smaller. */
export const PNG_BUDGET = 64 * 1024;

export interface ImageFile {
	/** The path from the site's root. */
	path: string;
	bytes: number;
}

export interface ImageReport {
	checked: number;
	problems: string[];
}

const CARD = /(^|\/)([\w-]+-)?og\.jpe?g$/i;

/** Whether a JPEG is a sharing card, the one place JPEG still belongs. */
export function isCard(path: string): boolean {
	return CARD.test(path);
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

/** The audit, kept pure so it can be tested without a site. */
export function auditImages(files: ImageFile[]): ImageReport {
	const problems: string[] = [];
	for (const file of files) {
		const lower = file.path.toLowerCase();
		if (/\.jpe?g$/.test(lower) && !isCard(file.path)) {
			problems.push(
				`${file.path} ships as JPEG (${kb(file.bytes)}); convert it to WebP, or name it og.jpg or <name>-og.jpg if it is a sharing card`,
			);
		}
		if (lower.endsWith(".png") && file.bytes > PNG_BUDGET) {
			problems.push(
				`${file.path} is a ${kb(file.bytes)} PNG; a photo ships as WebP, and a mark or a logo stays under ${kb(PNG_BUDGET)}`,
			);
		}
		if (file.bytes > IMAGE_BUDGET) {
			problems.push(
				`${file.path} weighs ${kb(file.bytes)}, over the ${kb(IMAGE_BUDGET)} budget; size it to about 2x its rendered width at quality about 75`,
			);
		}
	}
	return { checked: files.length, problems };
}

const IMAGE = /\.(webp|avif|jpe?g|png|gif|svg)$/i;

function imageFiles(dir: string, root: string): ImageFile[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return imageFiles(path, root);
		if (!IMAGE.test(entry.name)) return [];
		return [{ path: join(IMAGES_ROOT, path.slice(root.length + 1)), bytes: statSync(path).size }];
	});
}

/** The command: audits the images of the site in `cwd`. */
export function main(cwd: string = process.cwd()): void {
	const root = resolve(cwd, IMAGES_ROOT);
	if (!existsSync(root)) {
		console.log(`[images] no ${IMAGES_ROOT} in ${cwd}; nothing to check`);
		return;
	}
	const report = auditImages(imageFiles(root, root));
	if (report.problems.length > 0) {
		for (const problem of report.problems) console.error(`[images] ${problem}`);
		const count = report.problems.length;
		console.error(
			`[images] ${count} problem${count === 1 ? "" : "s"}; the budget is template-marketing's CLAUDE.md, Image budget`,
		);
		process.exit(1);
	}
	console.log(`[images] ${report.checked} images checked, all within budget`);
}
