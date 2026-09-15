/**
 * The target="_blank" props for a link, suppressed on protocol links: a
 * mailto: or tel: opened in a new tab leaves a dead blank tab on desktop and
 * breaks the handler handoff on phones, so the new tab request is ignored for
 * them no matter what the caller asks (learned on atelic.me's mailto CTA,
 * 2026-08-28).
 */
export function newTabProps(
	href: string,
	newTab: boolean | undefined,
): { target: "_blank"; rel: "noopener" } | Record<string, never> {
	if (!newTab || /^(mailto|tel|sms):/i.test(href)) return {};
	return { target: "_blank", rel: "noopener" };
}
