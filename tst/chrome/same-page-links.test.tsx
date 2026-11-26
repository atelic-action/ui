import { fireEvent, render, screen, within } from "@testing-library/react";
import { SiteShell } from "../../src/chrome";
import { testSite } from "../sections/site-fixture";

/*
 * A link to the page being read must not load it again: a page holding a
 * visitor's work (a vendor's tool, a form) would lose it. The shell cancels a
 * plain click on such a link and scrolls to the top; every other click goes
 * where the browser sends it.
 */

const site = { ...testSite, cta: { label: "Get an estimate", href: "/estimate" } };

function renderShell() {
	return render(
		<SiteShell site={site} currentPath="/estimate">
			<a href="/estimate/">Estimate with a slash</a>
			<a href="/about">About us</a>
			<a href="/estimate#steps">The steps</a>
			<a href="/estimate" target="_blank" rel="noreferrer">
				Estimate in a new tab
			</a>
			<a href="/estimate?step=2">Estimate at step two</a>
			<a href="/estimate?step=2&size=large">Estimate, large, at step two</a>
			<a href="tel:+15555550100">Call the shop</a>
			<a href="/estimate" onClick={(event) => event.preventDefault()}>
				Estimate the site handles
			</a>
		</SiteShell>,
	);
}

// What the shell did to the click, read on the window, after the shell's
// listener on the document, and before jsdom would try to navigate, which it
// cannot do and reports as noise.
let cancelled: boolean[] = [];
const record = (event: MouseEvent) => {
	cancelled.push(event.defaultPrevented);
	event.preventDefault();
};

let scrollTo: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	cancelled = [];
	window.history.pushState({}, "", "/estimate");
	window.addEventListener("click", record);
	scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
	window.removeEventListener("click", record);
	scrollTo.mockRestore();
	vi.unstubAllGlobals();
	window.history.pushState({}, "", "/");
});

const main = () => within(screen.getByRole("main"));
const link = (name: string) => main().getByRole("link", { name });

/** A pointer click, which counts one press; a click from the keyboard counts none. */
const tap = (element: HTMLElement, init: MouseEventInit = {}) =>
	fireEvent.click(element, { detail: 1, ...init });
const press = (element: HTMLElement) => fireEvent.click(element, { detail: 0 });

/** The header bar's own call to action, not the menu's or the sticky bar's copy of it. */
function headerCTA(): HTMLElement {
	const found = within(screen.getByRole("banner"))
		.getAllByRole("link", { name: /Get an estimate/, hidden: true })
		.find((each) => each.closest(".nav-cta"));
	if (!found) throw new Error("no header call to action");
	return found;
}

describe("a link to the page being read", () => {
	it("cancels the header's call to action to this page and scrolls to the top", () => {
		renderShell();
		tap(headerCTA());
		expect(cancelled).toEqual([true]);
		expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
	});

	it("treats a trailing slash as the same page", () => {
		window.history.pushState({}, "", "/estimate/");
		renderShell();
		tap(headerCTA());
		tap(link("Estimate with a slash"));
		expect(cancelled).toEqual([true, true]);
		expect(scrollTo).toHaveBeenCalledTimes(2);
	});

	it("scrolls at once under reduced motion", () => {
		vi.stubGlobal(
			"matchMedia",
			(query: string) => ({ matches: query.includes("reduce") }) as MediaQueryList,
		);
		renderShell();
		tap(link("Estimate with a slash"));
		expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
	});

	it("sets an ad's tracking parameters aside on the page being read", () => {
		window.history.pushState({}, "", "/estimate?gclid=abc&utm_source=google&fbclid=x");
		renderShell();
		tap(headerCTA());
		expect(cancelled).toEqual([true]);
	});

	it("sets them aside on the link too, and the order of the rest does not matter", () => {
		window.history.pushState({}, "", "/estimate?size=large&utm_medium=cpc&step=2&_gl=1");
		renderShell();
		tap(link("Estimate, large, at step two"));
		expect(cancelled).toEqual([true]);
	});

	it("leaves a link whose real query differs alone, tracking or not", () => {
		window.history.pushState({}, "", "/estimate?gclid=abc");
		renderShell();
		tap(link("Estimate at step two"));
		expect(cancelled).toEqual([false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a click a site's own handler took over alone", () => {
		renderShell();
		tap(link("Estimate the site handles"));
		// Cancelled by the site's handler, not the shell, which never scrolls.
		expect(cancelled).toEqual([true]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a link to another page alone", () => {
		renderShell();
		tap(link("About us"));
		expect(cancelled).toEqual([false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a link with a hash alone, so an in page jump still works", () => {
		renderShell();
		tap(link("The steps"));
		expect(cancelled).toEqual([false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a click with a modifier alone", () => {
		renderShell();
		const same = link("Estimate with a slash");
		for (const key of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) tap(same, { [key]: true });
		tap(same, { button: 1 });
		expect(cancelled).toEqual([false, false, false, false, false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a link that opens a new tab alone", () => {
		renderShell();
		tap(link("Estimate in a new tab"));
		expect(cancelled).toEqual([false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a tel link alone", () => {
		renderShell();
		tap(link("Call the shop"));
		expect(cancelled).toEqual([false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a link outside the shell alone", () => {
		renderShell();
		const outside = document.createElement("a");
		outside.href = "/estimate";
		document.body.append(outside);
		tap(outside);
		outside.remove();
		expect(cancelled).toEqual([false]);
	});

	it("moves focus to the page's main when followed from the keyboard", () => {
		renderShell();
		const cta = headerCTA();
		cta.focus();
		press(cta);
		expect(cancelled).toEqual([true]);
		const page = screen.getByRole("main");
		expect(page).toHaveFocus();
		expect(page).toHaveAttribute("tabindex", "-1");
		// Once focus moves on, the main is left as it was drawn.
		link("About us").focus();
		expect(page).not.toHaveAttribute("tabindex");
	});

	it("leaves focus where it was on a pointer click", () => {
		renderShell();
		const cta = headerCTA();
		cta.focus();
		tap(cta);
		expect(cancelled).toEqual([true]);
		expect(cta).toHaveFocus();
		expect(screen.getByRole("main")).not.toHaveAttribute("tabindex");
	});
});
