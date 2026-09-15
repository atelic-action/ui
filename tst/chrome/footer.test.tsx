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

	it("prints the closing note beside the copyright only when one is set", () => {
		const { container } = render(<Footer {...props} />);
		expect(container.textContent).not.toContain("Made with care in Denver");

		render(<Footer {...props} note="Made with care in Denver" />);
		expect(screen.getByText("Made with care in Denver")).toBeInTheDocument();
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

	it("carries the credit band at its foot unless turned off", () => {
		const { container, unmount } = render(<Footer {...props} />);
		expect(container.querySelector("footer.footer + .credit-bar")).toBeInTheDocument();
		unmount();

		const without = render(<Footer {...props} credit={false} />);
		expect(without.container.querySelector(".credit-bar")).toBeNull();
	});
});
