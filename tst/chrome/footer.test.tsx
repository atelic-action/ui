import { render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { Footer, type FooterProps } from "../../src/chrome";
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
