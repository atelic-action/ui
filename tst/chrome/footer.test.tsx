import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, render, screen, within } from "@testing-library/react";
import { createRef, Profiler } from "react";
import { Footer, type FooterProps } from "../../src/chrome";
import { footerLayoutFor, linkColumnsFor } from "../../src/chrome/Footer";
import { address, brand, email, phone } from "../fixtures";

const columns: FooterProps["columns"] = [
	{ heading: "Company", links: [{ label: "About", href: "/about" }] },
	{ heading: "Resources", links: [{ label: "Financing", href: "/financing" }] },
	{
		heading: "Social",
		links: [
			{
				label: "Instagram",
				href: "https://instagram.example/test",
				icon: "instagram",
				external: true,
			},
		],
	},
	{ heading: "Legal", links: [{ label: "Privacy", href: "/privacy" }] },
];

const props: FooterProps = {
	brand,
	rating: "4.8 on Google",
	address,
	addressHref: "https://maps.example/profile",
	phone,
	email,
	columns,
};

describe("Footer", () => {
	it("heads the brand column with the logo, then the rating, the address, the phone, and the email", () => {
		const { container } = render(<Footer {...props} />);
		const brandColumn = container.querySelector(".footer-brand") as HTMLElement;

		// The header's lockup: the mark, silent, beside the brand's name.
		const lockup = brandColumn.querySelector(".footer-lockup");
		expect(lockup?.querySelector("img")).toHaveAttribute("alt", "");
		expect(lockup?.textContent).toBe(brand.name);
		const order = Array.from(brandColumn.children, (child) => child.className || child.tagName);
		expect(order).toEqual(["footer-wordmark footer-lockup", "footer-rating", "nap"]);
		const nap = Array.from(brandColumn.querySelectorAll(".nap > *"), (row) => row.textContent);
		expect(nap).toEqual(["123 Main StDenver, CO 80205", phone.display, email]);
	});

	it("draws artwork that spells the name alone, named by its alt, when wordmark is false", () => {
		const { container } = render(
			<Footer
				{...props}
				brand={{ ...brand, logo: { src: "/logo.png", alt: "Test Practice", wordmark: false } }}
			/>,
		);
		const brandColumn = container.querySelector(".footer-brand") as HTMLElement;
		expect(within(brandColumn).getByRole("img", { name: "Test Practice" })).toBeInTheDocument();
		expect(brandColumn.querySelector(".footer-lockup")).toBeNull();
	});

	it("keeps the words alone for a brand with no image, and the tile beside the name", () => {
		const words = render(
			<Footer {...props} brand={{ name: "Test Practice", logo: { run: true } }} />,
		);
		const wordmark = words.container.querySelector(".footer-wordmark");
		expect(wordmark?.textContent).toBe("Test Practice");
		expect(wordmark).not.toHaveClass("footer-lockup");
		expect(wordmark?.querySelector("img")).toBeNull();
		words.unmount();

		const tile = render(
			<Footer {...props} brand={{ name: "Test Practice", logo: { tile: "T", wordmark: false } }} />,
		);
		expect(tile.container.querySelector(".footer-wordmark")?.textContent).toBe("Test Practice");
	});

	it("links the whole rating line to the profile in a new tab, named by its words", () => {
		render(<Footer {...props} ratingHref="https://maps.example/profile" />);
		const rating = screen.getByRole("link", { name: "4.8 on Google" });
		expect(rating).toHaveAttribute("href", "https://maps.example/profile");
		expect(rating).toHaveAttribute("target", "_blank");
		expect(rating.querySelectorAll(".footer-stars svg")).toHaveLength(5);
		expect(rating.querySelector(".footer-stars")).toHaveAttribute("aria-hidden", "true");
	});

	it("names the rating link by the site's own words when it gives them", () => {
		render(
			<Footer
				{...props}
				ratingHref="https://maps.example/profile"
				ratingLabel="4.8 on Google, opens the profile"
			/>,
		);
		expect(
			screen.getByRole("link", { name: "4.8 on Google, opens the profile" }),
		).toHaveTextContent("4.8 on Google");
	});

	it("sets the hours inside the brand column by default, under the address, headed Hours", () => {
		const hours = [
			{ label: "Mon to Fri", range: "9:00 am to 5:00 pm" },
			{ label: "Sat", range: "Closed" },
		];
		const { container } = render(<Footer {...props} hours={hours} />);
		const heading = screen.getByRole("heading", { name: "Hours", level: 2 });
		const nap = screen.getByRole("contentinfo").querySelector("address") as HTMLElement;
		expect(nap.parentElement).toContainElement(heading);
		expect(
			within(heading.parentElement as HTMLElement)
				.getAllByRole("definition")
				.map((d) => d.textContent),
		).toEqual(["9:00 am to 5:00 pm", "Closed"]);
		const grid = container.querySelector(".footer-grid") as HTMLElement;
		expect(grid).toHaveClass("has-brand-hours");
		expect(grid).not.toHaveClass("has-hours");
	});

	it("draws the hours as a column of their own, headed Hours, and counts it in the grid, when asked", () => {
		const hours = [
			{ label: "Mon to Fri", range: "9:00 am to 5:00 pm" },
			{ label: "Sat", range: "Closed" },
		];
		const { container } = render(<Footer {...props} hours={hours} hoursPlacement="column" />);
		const heading = screen.getByRole("heading", { name: "Hours", level: 2 });
		const column = heading.parentElement as HTMLElement;
		expect(
			within(column)
				.getAllByRole("term")
				.map((term) => term.textContent),
		).toEqual(["Mon to Fri", "Sat"]);
		expect(
			within(column)
				.getAllByRole("definition")
				.map((d) => d.textContent),
		).toEqual(["9:00 am to 5:00 pm", "Closed"]);
		const grid = container.querySelector(".footer-grid") as HTMLElement;
		expect(grid).toHaveClass("has-hours");
	});

	it("draws no hours column for no hours or an empty list, and takes its own heading", () => {
		const { unmount } = render(<Footer {...props} hours={[]} />);
		expect(screen.queryByRole("heading", { name: "Hours" })).toBeNull();
		unmount();
		render(
			<Footer
				{...props}
				hours={[{ label: "Daily", range: "7:00 am to 3:00 pm" }]}
				hoursHeading="Open"
			/>,
		);
		expect(screen.getByRole("heading", { name: "Open" })).toBeInTheDocument();
	});

	it("prints the rating as plain text beside five stars when it has no link", () => {
		const { container } = render(<Footer {...props} />);
		const rating = container.querySelector(".footer-rating");

		expect(rating?.textContent).toBe("4.8 on Google");
		expect(rating?.querySelectorAll(".footer-stars svg")).toHaveLength(5);
		expect(rating?.querySelector("a")).toBeNull();
		expect(rating?.closest("a")).toBeNull();
	});

	it("links the address to the Google profile, the phone to a call, and the email to mail", () => {
		render(<Footer {...props} />);

		const profile = screen.getByRole("link", { name: /123 Main St/ });
		expect(profile).toHaveAttribute("href", "https://maps.example/profile");
		expect(profile).toHaveAttribute("target", "_blank");
		expect(screen.getByRole("link", { name: phone.display })).toHaveAttribute(
			"href",
			`tel:${phone.e164}`,
		);
		// The address carries <wbr> break points, which jsdom (no UA sheet) reads
		// as blocks when it names the link, so it is found by its href here; the
		// stories name it in a real browser.
		const mail = document.querySelector(`a[href="mailto:${email}"]`);
		expect(mail?.textContent).toBe(email);
		expect(mail?.querySelectorAll("wbr")).toHaveLength(2);
	});

	it("prints the address as text when it has no profile to link, and drops it when none is given", () => {
		const { container, unmount } = render(<Footer {...props} addressHref={undefined} />);
		expect(container.querySelector("span.nap-address")?.textContent).toContain("123 Main St");
		expect(screen.queryByRole("link", { name: /123 Main St/ })).toBeNull();
		unmount();

		const bare = render(<Footer {...props} address={undefined} />);
		expect(bare.container.querySelector(".nap-address")).toBeNull();
		expect(screen.getByRole("link", { name: phone.display })).toBeInTheDocument();
	});

	it("lays the link columns out in the order given, each a nav under its heading", () => {
		const { container } = render(<Footer {...props} />);

		const headings = Array.from(
			container.querySelectorAll(".footer-column .footer-heading"),
			(h) => h.textContent,
		);
		expect(headings).toEqual(["Company", "Resources", "Social", "Legal"]);
		const social = screen.getByRole("navigation", { name: "Social" });
		const instagram = within(social).getByRole("link", { name: "Instagram" });
		expect(instagram.querySelector("svg")).not.toBeNull();
		expect(instagram).toHaveAttribute("target", "_blank");
		const legal = screen.getByRole("navigation", { name: "Legal" });
		expect(within(legal).getByRole("link", { name: "Privacy" }).querySelector("svg")).toBeNull();
	});

	it("leaves out a column with no links, setting no column count nothing reads", () => {
		const { container } = render(
			<Footer
				{...props}
				columns={[...(columns ?? []).slice(0, 2), { heading: "Social", links: [] }]}
			/>,
		);

		expect(screen.queryByRole("navigation", { name: "Social" })).toBeNull();
		expect(screen.getAllByRole("navigation")).toHaveLength(2);
		expect(container.querySelector(".footer-grid")).not.toHaveAttribute("style");
	});

	it("always carries the closing bar at its foot, and credit off empties its right side", () => {
		const { container, unmount } = render(<Footer {...props} />);
		const bar = container.querySelector("footer.footer + .closing-bar");
		expect(bar?.querySelector(".closing-bar-left")?.textContent).toContain(brand.name);
		expect(bar?.querySelector(".closing-bar-right")?.textContent).toBe(
			"Made with \u{1F49A} in Denver, Colorado by Atelic",
		);
		unmount();

		const without = render(<Footer {...props} credit={false} />);
		const plain = without.container.querySelector("footer.footer + .closing-bar");
		expect(plain?.querySelector(".closing-bar-left")?.textContent).toContain(brand.name);
		expect(plain?.querySelector(".closing-bar-right")).toBeNull();
		without.unmount();

		const worded = render(<Footer {...props} credit={false} note="Made with care in Denver" />);
		expect(worded.container.querySelector(".closing-bar-right")?.textContent).toBe(
			"Made with care in Denver",
		);
	});

	it("takes a placement it does not know as the default, never hiding the hours", () => {
		render(
			<Footer
				{...props}
				hours={[{ label: "Daily", range: "7:00 am to 3:00 pm" }]}
				hoursPlacement={"sidebar" as unknown as "column"}
			/>,
		);
		const heading = screen.getByRole("heading", { name: "Hours" });
		expect(
			within(heading.parentElement as HTMLElement).getByText("7:00 am to 3:00 pm"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("contentinfo").querySelector("address")?.parentElement,
		).toContainElement(heading);
	});

	it("hands its ref the footer element, forwarded so a React 18 host keeps it", () => {
		const ref = createRef<HTMLElement>();
		render(<Footer {...props} ref={ref} />);
		expect(ref.current).toBe(screen.getByRole("contentinfo"));
		expect(ref.current?.tagName).toBe("FOOTER");
		// A React 18 host strips `ref` from a plain function component's props;
		// a forwardRef component is the shape both majors deliver it to.
		expect((Footer as unknown as { $$typeof: symbol }).$$typeof).toBe(
			Symbol.for("react.forward_ref"),
		);
		expect(Footer.displayName).toBe("Footer");
	});
});

describe("linkColumnsFor", () => {
	// A column at a 158px floor is decided at 159, the floor rounded up and a
	// pixel of headroom, so four need 4 * 159 + 3 * 24 = 708px.
	const need = 708;
	const decide = (box: number, widest: number, count = 4) =>
		linkColumnsFor({ box, widest, floor: 158, count, gap: 24 });

	it("sets every column across when the box holds them, to the pixel", () => {
		expect(decide(need, 150)).toBe(4);
		expect(decide(need + 300, 150)).toBe(4);
	});

	it("sets two by two when the box falls a fraction of a pixel short, never three and one", () => {
		expect(decide(need - 0.19, 150)).toBe(2);
	});

	it("keeps a pixel of room past the widest label, rounded up, so the hair under each share never wraps it", () => {
		// A 157.6px label: 158 rounded up and one more, so four need 708 again.
		expect(linkColumnsFor({ box: 707.9, widest: 157.6, floor: 0, count: 4, gap: 24 })).toBe(2);
		expect(linkColumnsFor({ box: 708, widest: 157.6, floor: 0, count: 4, gap: 24 })).toBe(4);
	});

	it("measures against the widest column when it is wider than the floor", () => {
		expect(decide(need, 200)).toBe(2);
		expect(decide(4 * 201 + 72, 200)).toBe(4);
	});

	it("sets two or fewer across always, and three across or two and one", () => {
		expect(decide(10, 200, 2)).toBe(2);
		expect(decide(10, 200, 1)).toBe(1);
		expect(decide(3 * 159 + 48, 0, 3)).toBe(3);
		expect(decide(3 * 159 + 47.9, 0, 3)).toBe(2);
	});

	it("reads the gap it is handed, never one of its own", () => {
		expect(
			linkColumnsFor({ box: 4 * 159 + 3 * 40, widest: 0, floor: 158, count: 4, gap: 40 }),
		).toBe(4);
		expect(linkColumnsFor({ box: need, widest: 0, floor: 158, count: 4, gap: 40 })).toBe(2);
	});
});

describe("footerLayoutFor", () => {
	const gaps = { brand: 24, link: 24, brandTwo: 32, linkTwo: 32 };
	// A 159px column: four across beside the brand need brand + 24 + 708;
	// two by two beside it, brand + 32 + 2 * 159 + 32 = brand + 382.
	const at = (row: number, brand: number, count = 4) => {
		const { layout, columns } = footerLayoutFor({
			row,
			brand,
			widest: 150,
			floor: 158,
			count,
			gaps,
		});
		return { layout, columns };
	};

	it("sets every column beside the brand when the brand, the gap, and four fit", () => {
		expect(at(300 + 24 + 708, 300)).toEqual({ layout: "beside", columns: 4 });
	});

	it("sets two by two beside the brand when four do not fit beside it, never the brand alone", () => {
		expect(at(300 + 24 + 708 - 0.19, 300)).toEqual({ layout: "beside-two", columns: 2 });
		// The tablet case: a 1024 wrap of about 976px and a brand of 360.
		expect(at(976, 360)).toEqual({ layout: "beside-two", columns: 2 });
		expect(at(300 + 382, 300)).toEqual({ layout: "beside-two", columns: 2 });
	});

	it("gives the brand its own row only when two by two beside it does not fit", () => {
		expect(at(300 + 382 - 0.19, 300)).toEqual({ layout: "stacked", columns: 2 });
		expect(at(720, 700)).toEqual({ layout: "stacked", columns: 4 });
	});

	it("keeps three columns under the brand, three across, never two and a lone one beside it", () => {
		// Three across beside the brand need 300 + 24 + 525; two by two beside it would fit.
		expect(at(300 + 24 + 525 - 1, 300, 3)).toEqual({ layout: "stacked", columns: 3 });
		expect(at(300 + 24 + 525, 300, 3)).toEqual({ layout: "beside", columns: 3 });
	});

	it("never sets two or fewer columns two by two beside the brand", () => {
		expect(at(500, 300, 2)).toEqual({ layout: "stacked", columns: 2 });
	});

	it("reports the row widths where the layout changes, for a test to look at closely", () => {
		const { breaks } = footerLayoutFor({
			row: 900,
			brand: 300,
			widest: 150,
			floor: 158,
			count: 4,
			gaps,
		});
		expect(breaks).toEqual([300 + 24 + 708, 300 + 382, 708]);
	});

	it("reads the gaps it is handed", () => {
		const wide = { brand: 56, link: 24, brandTwo: 56, linkTwo: 32 };
		const { layout } = footerLayoutFor({
			row: 300 + 382,
			brand: 300,
			widest: 150,
			floor: 158,
			count: 4,
			gaps: wide,
		});
		expect(layout).toBe("stacked");
	});
});

describe("Footer link columns with the hours in the brand column", () => {
	const hours = [{ label: "Mon", range: "7:00 am to 3:00 pm" }];
	const grid = (container: HTMLElement) => container.querySelector(".footer-grid") as HTMLElement;
	const box = (container: HTMLElement) =>
		container.querySelector(".footer-links") as HTMLElement | null;
	const withLong = (label: string) => [
		...(columns ?? []).slice(0, 1),
		{ heading: "Resources", links: [{ label, href: "/financing" }] },
		...(columns ?? []).slice(2),
	];

	/**
	 * A layout for jsdom, which has none: the box is `boxWidth` wide, a link
	 * is 16px (a 160px floor), and a column set to max-content is its longest
	 * label at 8px a character. Records whether every column was already set
	 * when any column's width was read.
	 */
	function layout(rowWidth: number, brandWidth = 0, options: { phone?: boolean } = {}) {
		const allSet: boolean[] = [];
		const real = window.getComputedStyle.bind(window);
		vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
			const style = real(element);
			const html = element as HTMLElement;
			let width = "";
			let fontSize = style.fontSize;
			if (html.classList?.contains("footer-links")) width = `${rowWidth}px`;
			if (html.classList?.contains("footer-grid")) width = `${rowWidth}px`;
			if (html.classList?.contains("footer-brand")) {
				width = html.style.width === "max-content" ? `${brandWidth}px` : "50px";
			}
			if (html.classList?.contains("footer-column")) {
				const holder = html.closest(".footer-links") as HTMLElement;
				allSet.push(
					Array.from(holder.querySelectorAll<HTMLElement>(".footer-column")).every(
						(column) => column.style.width === "max-content",
					),
				);
				const longest = Math.max(
					...Array.from(html.querySelectorAll("a, [role=heading]")).map(
						(one) => one.textContent?.length ?? 0,
					),
				);
				width = html.style.width === "max-content" ? `${longest * 8}px` : "50px";
			}
			if (element.tagName === "A") fontSize = "16px";
			// The sheet's gaps, which jsdom does not load, and the box a phone
			// sets as display: contents.
			const custom: Record<string, string> = html.classList?.contains("footer-grid")
				? {
						"--_brand-gap": "24px",
						"--_link-gap": "24px",
						"--_brand-gap-two": "32px",
						"--_link-gap-two": "32px",
					}
				: {};
			const display =
				options.phone && html.classList?.contains("footer-links")
					? "contents"
					: style.display || "block";
			return new Proxy(style, {
				get: (target, key) => {
					if (key === "width") return width;
					if (key === "fontSize") return fontSize;
					if (key === "display") return display;
					if (key === "getPropertyValue") {
						return (name: string) => custom[name] ?? target.getPropertyValue(name);
					}
					return Reflect.get(target, key);
				},
			});
		});
		return { allSet, options };
	}

	/** A ResizeObserver that records what it watches and lets a test fire it. */
	function observer() {
		const watched: Element[] = [];
		const callbacks: ResizeObserverCallback[] = [];
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(callback: ResizeObserverCallback) {
					callbacks.push(callback);
				}
				observe(element: Element) {
					watched.push(element);
				}
				disconnect() {}
			},
		);
		const fire = async () => {
			for (const callback of callbacks) callback([], {} as ResizeObserver);
			await act(async () => {
				await new Promise((resolve) => requestAnimationFrame(resolve));
			});
		};
		return { watched, fire };
	}

	it("measures again when the brand block changes size, so it watches the brand too", () => {
		const { watched } = observer();
		layout(1060);
		const { container } = render(
			<Footer {...props} hours={hours} columns={withLong("Financing and insurance claims")} />,
		);
		expect(watched).toContain(container.querySelector(".footer-brand"));
		vi.unstubAllGlobals();
	});

	it("lets the tablet's choice go when the footer narrows to a phone's", async () => {
		const { fire } = observer();
		const { options } = layout(1060);
		const { container } = render(
			<Footer {...props} hours={hours} columns={withLong("Financing and insurance claims")} />,
		);
		expect(grid(container)).toHaveAttribute("data-footer-layout", "beside");
		options.phone = true;
		await fire();
		expect(grid(container)).not.toHaveAttribute("data-footer-layout");
		expect(box(container)).not.toHaveAttribute("data-link-columns");
		expect(grid(container).style.getPropertyValue("--_link-floor")).toBe("");
		vi.unstubAllGlobals();
	});

	afterEach(() => vi.restoreAllMocks());

	it("draws no link box at all when there is no link column, so it takes no gap", () => {
		const { container } = render(<Footer {...props} hours={hours} columns={[]} />);
		expect(box(container)).toBeNull();
		expect(grid(container).style.getPropertyValue("--_link-count")).toBe("");
		const { container: emptied } = render(
			<Footer {...props} hours={hours} columns={[{ heading: "Legal", links: [] }]} />,
		);
		expect(box(emptied)).toBeNull();
	});

	it("leaves the stylesheet's own choice alone until the client measures, so a prerender names none", async () => {
		const { renderToString } = await import("react-dom/server");
		const html = renderToString(<Footer {...props} hours={hours} />);
		expect(html).toContain("footer-links");
		expect(html).toContain("--_link-count:4");
		expect(html).not.toContain("data-link-columns");
		expect(html).not.toContain("--_link-floor");
	});

	it("names no choice where the box has no layout to read, as in a test with none", () => {
		const { container } = render(<Footer {...props} hours={hours} />);
		expect(box(container)).not.toHaveAttribute("data-link-columns");
		expect(grid(container).style.getPropertyValue("--_link-floor")).toBe("");
	});

	it("names two by two beside the brand for a row a fraction short of four, and floors it at the widest column", () => {
		// 30 characters at 8px: the widest column is 240px, decided at 241, so
		// four need 1036px and the 24px beside the brand.
		const { allSet } = layout(1059.81);
		const { container } = render(
			<Footer {...props} hours={hours} columns={withLong("Financing and insurance claims")} />,
		);
		expect(box(container)).toHaveAttribute("data-link-columns", "2");
		expect(grid(container)).toHaveAttribute("data-footer-layout", "beside-two");
		expect(grid(container).style.getPropertyValue("--_link-floor")).toBe(
			"max(calc(10 * var(--footer-link-size)), 241px)",
		);
		// Every column set before any was read: one layout for the measure.
		expect(allSet.length).toBeGreaterThan(0);
		expect(allSet.every(Boolean)).toBe(true);
		// The measure hands each column its own style back.
		for (const column of Array.from(container.querySelectorAll<HTMLElement>(".footer-column"))) {
			expect(column.getAttribute("style")).toBeFalsy();
		}
	});

	it("names every column across beside the brand when the row holds the widest four", () => {
		layout(1060);
		const { container } = render(
			<Footer {...props} hours={hours} columns={withLong("Financing and insurance claims")} />,
		);
		expect(box(container)).toHaveAttribute("data-link-columns", "4");
		expect(grid(container)).toHaveAttribute("data-footer-layout", "beside");
	});

	it("gives the brand a row of its own only when even two by two beside it does not fit", () => {
		// A 600px brand: two by two beside it needs 600 + 32 + 482 + 32 = 1146px.
		layout(1100, 600);
		const { container } = render(
			<Footer {...props} hours={hours} columns={withLong("Financing and insurance claims")} />,
		);
		expect(grid(container)).toHaveAttribute("data-footer-layout", "stacked");
		// Under it the row holds all four at 1036px.
		expect(box(container)).toHaveAttribute("data-link-columns", "4");
		// The brand is measured at its own width and handed its style back.
		expect(container.querySelector(".footer-brand")?.getAttribute("style")).toBeFalsy();
	});

	it("measures again when a label changes, not only on a resize", () => {
		layout(1060);
		const { container, rerender } = render(
			<Footer {...props} hours={hours} columns={withLong("Financing and insurance claims")} />,
		);
		expect(box(container)).toHaveAttribute("data-link-columns", "4");
		rerender(
			<Footer
				{...props}
				hours={hours}
				columns={withLong("Financing and insurance claims, explained")}
			/>,
		);
		expect(box(container)).toHaveAttribute("data-link-columns", "2");
		expect(grid(container).style.getPropertyValue("--_link-floor")).toContain("329px");
	});

	it("measures a resize on the next frame, never inside the observer's callback", async () => {
		const observed: ResizeObserverCallback[] = [];
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(callback: ResizeObserverCallback) {
					observed.push(callback);
				}
				observe() {}
				disconnect() {}
			},
		);
		layout(1060);
		render(
			<Footer {...props} hours={hours} columns={withLong("Financing and insurance claims")} />,
		);
		const reads = () => vi.mocked(window.getComputedStyle).mock.calls.length;
		const before = reads();
		for (const callback of observed) {
			callback([], {} as ResizeObserver);
			callback([], {} as ResizeObserver);
		}
		expect(reads()).toBe(before);
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(reads()).toBeGreaterThan(before);
		vi.unstubAllGlobals();
	});

	it("attaches a swapped ref and clears the one it replaced", () => {
		const first = createRef<HTMLElement>();
		const second = createRef<HTMLElement>();
		const { rerender } = render(<Footer {...props} hours={hours} ref={first} />);
		expect(first.current).toBe(screen.getByRole("contentinfo"));
		rerender(<Footer {...props} hours={hours} ref={second} />);
		expect(second.current).toBe(screen.getByRole("contentinfo"));
		expect(first.current).toBeNull();
	});

	it("calls a callback ref's returned cleanup on detach, in place of a call with null", () => {
		const heard: (HTMLElement | null)[] = [];
		let cleaned = 0;
		const ref = (element: HTMLElement | null) => {
			heard.push(element);
			return () => {
				cleaned += 1;
			};
		};
		const { unmount } = render(<Footer {...props} hours={hours} ref={ref} />);
		unmount();
		expect(cleaned).toBe(1);
		expect(heard).toEqual([expect.any(HTMLElement)]);
	});

	it("measures nothing on a phone, where the box is display: contents, so nothing is set and nothing renders again", () => {
		layout(1060, 0, { phone: true });
		let renders = 0;
		const counted = (
			<Profiler id="footer" onRender={() => renders++}>
				<Footer {...props} hours={hours} columns={withLong("Financing and insurance claims")} />
			</Profiler>
		);
		const { container } = render(counted);
		expect(grid(container)).not.toHaveAttribute("data-footer-layout");
		expect(box(container)).not.toHaveAttribute("data-link-columns");
		expect(grid(container).style.getPropertyValue("--_link-floor")).toBe("");
		expect(renders).toBe(1);
	});

	it("measures nothing with the hours as a column of their own, where the columns stand in the grid", () => {
		const read = vi.spyOn(window, "getComputedStyle");
		const { container } = render(<Footer {...props} hours={hours} hoursPlacement="column" />);
		expect(box(container)).toBeNull();
		expect(read).not.toHaveBeenCalled();
	});
});

describe("the brand placement's sheet", () => {
	const sheet = () =>
		readFileSync(
			join(import.meta.dirname, "..", "..", "src", "styles", "chrome.css"),
			"utf8",
		).replace(/\s+/g, " ");

	it("keeps the choice before the measure as it was, labels held whole", () => {
		expect(sheet()).toContain("--_link-floor: calc(10 * var(--footer-link-size));");
		const rule = sheet().match(
			/\.footer-grid\.has-brand-hours \.footer-links > \.footer-column \{([^}]*)\}/,
		)?.[1];
		expect(rule).toContain("min-width: max-content;");
		expect(rule).toContain(
			"min(calc(50% - 16px), max(var(--_link-floor), calc((var(--_links-need) - 100%) * 999)))",
		);
	});

	it("gives a measured box exactly a share or exactly a half, and never lets a label widen one", () => {
		const across = sheet().match(
			/\.footer-links\[data-link-columns\] > \.footer-column \{([^}]*)\}/,
		)?.[1];
		expect(across).toContain("min-width: 0;");
		expect(across).toContain(
			"calc( (100% - (var(--_link-count, 4) - 1) * var(--_link-gap)) / var(--_link-count, 4) - 0.5px )",
		);
		const half = sheet().match(
			/\.footer-links\[data-link-columns="2"\] > \.footer-column \{([^}]*)\}/,
		)?.[1];
		expect(half).toContain("flex-basis: calc(50% - var(--_link-gap) / 2 - 0.5px);");
	});

	it("keeps the brand at its own width two by two beside it, so the columns keep their headroom", () => {
		expect(sheet()).toContain(
			'.atelic-ui .footer-grid.has-brand-hours[data-footer-layout="beside-two"] > .footer-brand { flex-grow: 0; }',
		);
	});

	it("declares once the gaps the measure reads", () => {
		for (const [name, value] of [
			["--_brand-gap", "24px"],
			["--_link-gap", "24px"],
			["--_brand-gap-two", "32px"],
			["--_link-gap-two", "32px"],
			["--_link-row-gap-two", "40px"],
		]) {
			expect(sheet().split(`${name}: ${value};`)).toHaveLength(2);
		}
	});
});
