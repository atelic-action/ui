import { render, screen } from "@testing-library/react";
import { Footer, type FooterProps } from "../../src/chrome";
import { address, brand, email, links, phone } from "../fixtures";

const props: FooterProps = { brand, links, address, phone, email, blurb: "Blurb." };

/*
 * The footer's wording overrides are optional, so the thing worth locking is
 * that leaving them out changes nothing: the "Visit" heading and the address
 * print exactly as every shipped site has them.
 */
describe("Footer", () => {
	it("heads the contact column with Visit and prints the address by default", () => {
		const { container } = render(<Footer {...props} />);

		expect(screen.getByRole("heading", { name: "Visit" })).toBeInTheDocument();
		const nap = container.querySelector("address.nap")?.textContent ?? "";
		expect(nap).toContain(brand.name);
		expect(nap).toContain("123 Main St");
		expect(nap).toContain("Denver, CO 80205");
	});

	it("takes a heading override for a business with nothing to visit", () => {
		render(<Footer {...props} contactHeading="Get in touch" />);

		expect(screen.getByRole("heading", { name: "Get in touch" })).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Visit" })).not.toBeInTheDocument();
	});

	it("drops the name and address and keeps the contact details when no address is given", () => {
		const { container } = render(<Footer {...props} address={undefined} />);

		const nap = container.querySelector("address.nap")?.textContent ?? "";
		expect(nap).not.toContain("123 Main St");
		expect(nap).not.toContain("Denver, CO 80205");
		expect(screen.getByRole("link", { name: email })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: phone.display })).toBeInTheDocument();
	});

	it("hands its name and note to the closing bar, and keeps the legal links above it", () => {
		const { container } = render(
			<Footer
				{...props}
				note="Made with care in Denver"
				legalLinks={[{ label: "Privacy", href: "/privacy" }]}
			/>,
		);

		const bar = container.querySelector("footer.footer + .closing-bar");
		expect(bar?.textContent).toContain(`© ${new Date().getFullYear()} ${brand.name}`);
		expect(bar?.textContent).toContain("Made with care in Denver");
		expect(bar?.textContent).not.toContain("Privacy");
		expect(container.querySelector("footer.footer .footer-legal")?.textContent).toBe("Privacy");
	});

	it("prints hours rows exactly as the site formatted them", () => {
		const { container } = render(
			<Footer
				{...props}
				hours={[
					{ label: "Mon", range: "11a to 7p" },
					{ label: "Sun", range: "Closed" },
				]}
			/>,
		);

		expect(screen.getByRole("heading", { name: "Hours" })).toBeInTheDocument();
		const rows = Array.from(container.querySelectorAll(".footer-hours > span"), (row) =>
			row.textContent?.replace(/\s+/g, " "),
		);
		expect(rows).toEqual(["Mon 11a to 7p", "Sun Closed"]);
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
});
