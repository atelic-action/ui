/**
 * Text made safe to set inside an HTML element or a quoted attribute. Plain
 * TypeScript with no imports, so the email renderer and the access gate's
 * server side (which ships compiled) both use the one copy.
 */
export function escapeHTML(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
