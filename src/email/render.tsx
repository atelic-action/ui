import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { atelicFonts, atelicPalette, type Fonts, type Palette } from "../tokens";
import { FailurePage } from "./frame";
import { EmailThemeProvider } from "./theme";

/*
 * The page shell is a template string rather than JSX, and deliberately so:
 * React emits no doctype, React 19 hoists and reorders head tags, and it would
 * escape the `>` in `details>summary` inside a style block. Only the rows
 * inside the 680 column go through React.
 */

/** jq's `esc`, in the same order, for the strings that land in the shell. */
function esc(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

const WRAPPER_OPEN = "<table><tbody>";
const WRAPPER_CLOSE = "</tbody></table>";

/**
 * Rows render inside a throwaway table so React's nesting validation sees a
 * `<tr>` where one belongs; the wrapper is sliced back off.
 */
function renderRows(children: ReactNode, palette: Palette, fonts: Fonts): string {
	const markup = renderToStaticMarkup(
		<EmailThemeProvider palette={palette} fonts={fonts}>
			<table>
				<tbody>{children}</tbody>
			</table>
		</EmailThemeProvider>,
	);
	if (markup.startsWith(WRAPPER_OPEN) && markup.endsWith(WRAPPER_CLOSE)) {
		return markup.slice(WRAPPER_OPEN.length, markup.length - WRAPPER_CLOSE.length);
	}
	return markup;
}

export type RenderEmailOptions = {
	title: string;
	/** The inbox preview line, hidden in the body. */
	preheader?: string;
	/** The rows inside the 680 column: a Masthead, cards, a Footer. */
	children?: ReactNode;
	palette?: Palette;
	fonts?: Fonts;
};

/** The whole document: preheader for the inbox preview, the 680 column, the rows. */
export function renderEmail({
	title,
	preheader,
	children,
	palette = atelicPalette,
	fonts = atelicFonts,
}: RenderEmailOptions): string {
	const ground = palette.ground;
	const rows = renderRows(children, palette, fonts);
	return (
		`<!doctype html><html lang="en"><head><meta charset="utf-8">` +
		`<meta name="viewport" content="width=device-width, initial-scale=1">` +
		`<meta name="color-scheme" content="light"><title>${esc(title)}</title>` +
		`<style>body{margin:0;padding:0;background:${ground}}a{color:${palette.ink}}` +
		`details>summary{list-style:none}details>summary::-webkit-details-marker{display:none}` +
		`@media (max-width:700px){.wrap{width:100%!important}}</style></head>` +
		`<body style="margin:0;padding:0;background:${ground};-webkit-text-size-adjust:100%">` +
		(preheader
			? `<span style="display:none;font-size:1px;color:${ground};max-height:0;overflow:hidden">${esc(preheader)}</span>`
			: "") +
		`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${ground}">` +
		`<tr><td align="center" style="padding:28px 12px 48px">` +
		`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="680" class="wrap" style="width:680px;max-width:680px">` +
		rows +
		`</table></td></tr></table></body></html>`
	);
}

export type RenderFailureEmailOptions = {
	runnerTitle: string;
	eyebrowText: string;
	reason: string;
	logTail: string;
	palette?: Palette;
	fonts?: Fonts;
};

/** The failure page: the reason on top and the log's tail beneath. */
export function renderFailureEmail({
	runnerTitle,
	eyebrowText,
	reason,
	logTail,
	palette,
	fonts,
}: RenderFailureEmailOptions): string {
	return renderEmail({
		title: `${runnerTitle}: did not run`,
		preheader: reason,
		palette,
		fonts,
		children: (
			<FailurePage
				runnerTitle={runnerTitle}
				eyebrowText={eyebrowText}
				reason={reason}
				logTail={logTail}
			/>
		),
	});
}
