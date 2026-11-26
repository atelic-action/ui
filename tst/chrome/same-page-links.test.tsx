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
			<a href="tel:+15555550100">Call the shop</a>
		</SiteShell>,
	);
}

// What the shell did to the click, read after its listener and before jsdom
// would try to navigate, which it cannot do and reports as noise.
let cancelled: boolean[] = [];
const record = (event: MouseEvent) => {
	cancelled.push(event.defaultPrevented);
	event.preventDefault();
};

let scrollTo: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	cancelled = [];
	window.history.pushState({}, "", "/estimate");
	document.addEventListener("click", record);
	scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
	document.removeEventListener("click", record);
	scrollTo.mockRestore();
	vi.unstubAllGlobals();
	window.history.pushState({}, "", "/");
});

const main = () => within(screen.getByRole("main"));

/** The header bar's own call to action, not the menu's or the sticky bar's copy of it. */
function headerCTA(): HTMLElement {
	const link = within(screen.getByRole("banner"))
		.getAllByRole("link", { name: /Get an estimate/, hidden: true })
		.find((each) => each.closest(".nav-cta"));
	if (!link) throw new Error("no header call to action");
	return link;
}

describe("a link to the page being read", () => {
	it("cancels the header's call to action to this page and scrolls to the top", () => {
		renderShell();
		fireEvent.click(headerCTA());
		expect(cancelled).toEqual([true]);
		expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
	});

	it("treats a trailing slash as the same page", () => {
		window.history.pushState({}, "", "/estimate/");
		renderShell();
		fireEvent.click(headerCTA());
		fireEvent.click(main().getByRole("link", { name: "Estimate with a slash" }));
		expect(cancelled).toEqual([true, true]);
		expect(scrollTo).toHaveBeenCalledTimes(2);
	});

	it("scrolls at once under reduced motion", () => {
		vi.stubGlobal(
			"matchMedia",
			(query: string) => ({ matches: query.includes("reduce") }) as MediaQueryList,
		);
		renderShell();
		fireEvent.click(main().getByRole("link", { name: "Estimate with a slash" }));
		expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
	});

	it("leaves a link to another page alone", () => {
		renderShell();
		fireEvent.click(main().getByRole("link", { name: "About us" }));
		expect(cancelled).toEqual([false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a link with a hash alone, so an in page jump still works", () => {
		renderShell();
		fireEvent.click(main().getByRole("link", { name: "The steps" }));
		expect(cancelled).toEqual([false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a click with a modifier alone", () => {
		renderShell();
		const link = main().getByRole("link", { name: "Estimate with a slash" });
		for (const key of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) {
			fireEvent.click(link, { [key]: true });
		}
		fireEvent.click(link, { button: 1 });
		expect(cancelled).toEqual([false, false, false, false, false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a link that opens a new tab alone", () => {
		renderShell();
		fireEvent.click(main().getByRole("link", { name: "Estimate in a new tab" }));
		expect(cancelled).toEqual([false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a link with another query alone", () => {
		renderShell();
		fireEvent.click(main().getByRole("link", { name: "Estimate at step two" }));
		expect(cancelled).toEqual([false]);
	});

	it("leaves a tel link alone", () => {
		renderShell();
		fireEvent.click(main().getByRole("link", { name: "Call the shop" }));
		expect(cancelled).toEqual([false]);
		expect(scrollTo).not.toHaveBeenCalled();
	});

	it("leaves a link outside the shell alone", () => {
		renderShell();
		const outside = document.createElement("a");
		outside.href = "/estimate";
		document.body.append(outside);
		fireEvent.click(outside);
		outside.remove();
		expect(cancelled).toEqual([false]);
	});
});
