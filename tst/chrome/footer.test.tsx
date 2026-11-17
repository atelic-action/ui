import { render, screen, within } from "@testing-library/react";
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

		expect(within(brandColumn).getByRole("img", { name: brand.name })).toBeInTheDocument();
		const order = Array.from(brandColumn.children, (child) => child.className || child.tagName);
		expect(order).toEqual(["IMG", "footer-rating", "nap"]);
		const nap = Array.from(brandColumn.querySelectorAll(".nap > *"), (row) => row.textContent);
		expect(nap).toEqual(["123 Main StDenver, CO 80205", phone.display, email]);
	});

	it("prints the rating as plain text beside five stars, never a link", () => {
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
		expect(screen.getByRole("link", { name: email })).toHaveAttribute("href", `mailto:${email}`);
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
			container.querySelectorAll(".footer-column h4"),
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

	it("leaves out a column with no links and sizes the grid to the columns shown", () => {
		const { container } = render(
			<Footer
				{...props}
				columns={[...(columns ?? []).slice(0, 2), { heading: "Social", links: [] }]}
			/>,
		);

		expect(screen.queryByRole("navigation", { name: "Social" })).toBeNull();
		expect(
			(container.querySelector(".footer-grid") as HTMLElement).style.getPropertyValue(
				"--footer-columns",
			),
		).toBe("2");
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
