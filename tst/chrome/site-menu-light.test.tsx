import { fireEvent, render, screen, within } from "@testing-library/react";
import { SiteMenu, SiteShell } from "../../src/chrome";
import { menuPhoneLabel } from "../../src/chrome/SiteMenu";
import { BasePathProvider } from "../../src/routing";
import type { SiteConfig } from "../../src/sections";
import { brand, links, phone, primaryCTA } from "../fixtures";
import { testSite } from "../sections/site-fixture";

const phones = [
	{ e164: "+15555550142", display: "(555) 555-0142", label: "The shop" },
	{
		e164: "+15555550143",
		display: "(555) 555-0143",
		label: "Wholesale",
		menuLabel: "Call or text",
	},
];

describe("the phone menu's words for a number", () => {
	it("takes the menu label, then the bar's label, then a neutral Call", () => {
		expect(menuPhoneLabel({ ...phone, label: "Shop", menuLabel: "Call or text" })).toBe(
			"Call or text",
		);
		expect(menuPhoneLabel({ ...phone, label: "Shop" })).toBe("Shop");
		expect(menuPhoneLabel(phone)).toBe("Call");
	});

	it("never says a business answers texts unless the site does: the dark sheet's default line is CALL", () => {
		render(<SiteMenu open onClose={() => {}} links={links} contact={{ phone }} />);
		const dialog = screen.getByRole("dialog");
		expect(within(dialog).getByRole("link", { name: /^CALL\s+\(555\) 555-0100$/ })).toHaveAttribute(
			"href",
			`tel:${phone.e164}`,
		);
		expect(dialog.textContent).not.toMatch(/TEXT/);
	});

	it("lists the header's numbers on the dark sheet by their menu labels", () => {
		render(<SiteMenu open onClose={() => {}} links={links} phones={phones} />);
		const dialog = within(screen.getByRole("dialog"));
		expect(dialog.getByRole("link", { name: /^THE SHOP/ })).toHaveAttribute(
			"href",
			"tel:+15555550142",
		);
		expect(dialog.getByRole("link", { name: /^CALL OR TEXT/ })).toHaveAttribute(
			"href",
			"tel:+15555550143",
		);
	});
});

describe("the phone menu's call to action", () => {
	it("reads its menu label on either sheet, and its label without one", () => {
		const cta = { ...primaryCTA, label: "Order", menuLabel: "Order for Saturday" };
		for (const surface of ["dark", "light"] as const) {
			const { unmount } = render(
				<SiteMenu open onClose={() => {}} links={links} primaryCTA={cta} surface={surface} />,
			);
			expect(screen.getByRole("link", { name: /Order for Saturday/ })).toBeInTheDocument();
			expect(screen.queryByRole("link", { name: /^Order$/ })).toBeNull();
			unmount();
		}
		render(<SiteMenu open onClose={() => {}} links={links} primaryCTA={primaryCTA} />);
		expect(screen.getByRole("link", { name: "Book Now" })).toBeInTheDocument();
	});
});

describe("the light sheet", () => {
	it("draws the lockup linking home, the close button first in focus, the rows, and the foot", () => {
		render(
			<SiteMenu
				open
				onClose={() => {}}
				links={links}
				primaryCTA={{ ...primaryCTA, arrow: true }}
				phones={phones}
				surface="light"
				brand={brand}
			/>,
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveClass("mobile-menu", "is-light");
		const menu = within(dialog);
		expect(menu.getByRole("link", { name: "Test Practice home" })).toHaveAttribute("href", "/");
		expect(menu.getByRole("button", { name: "Close menu" })).toHaveFocus();
		// Plain entries carry no number on the light sheet.
		expect(menu.getByRole("link", { name: "About" }).textContent).toBe("About");
		// The call to action with its arrow, and a card per number, each a tel link.
		const action = menu.getByRole("link", { name: /Book Now/ });
		expect(action.querySelector(".arrow")).not.toBeNull();
		expect(menu.getByRole("link", { name: "The shop (555) 555-0142" })).toHaveAttribute(
			"href",
			"tel:+15555550142",
		);
		expect(menu.getByRole("link", { name: "Call or text (555) 555-0143" })).toHaveAttribute(
			"href",
			"tel:+15555550143",
		);
	});

	it("falls back to the contact block's one phone as a card named Call", () => {
		render(
			<SiteMenu
				open
				onClose={() => {}}
				links={links}
				contact={{ phone }}
				surface="light"
				brand={brand}
			/>,
		);
		expect(screen.getByRole("link", { name: "Call (555) 555-0100" })).toHaveAttribute(
			"href",
			`tel:${phone.e164}`,
		);
	});

	it("sets the contact phone with its menuLabel on either sheet, and says Call without one", () => {
		for (const surface of ["light", "dark"] as const) {
			const labeled = render(
				<SiteMenu
					open
					onClose={() => {}}
					links={links}
					contact={{ phone: { ...phone, menuLabel: "Call / Text" } }}
					surface={surface}
					brand={brand}
				/>,
			);
			expect(
				screen.getByRole("link", { name: /^Call \/ Text\s+\(555\) 555-0100$/i }),
				surface,
			).toHaveAttribute("href", `tel:${phone.e164}`);
			labeled.unmount();
			const plain = render(
				<SiteMenu
					open
					onClose={() => {}}
					links={links}
					contact={{ phone }}
					surface={surface}
					brand={brand}
				/>,
			);
			expect(
				screen.getByRole("link", { name: /^Call\s+\(555\) 555-0100$/i }),
				surface,
			).toBeVisible();
			plain.unmount();
		}
	});

	it("carries the config's phone.menuLabel from the shell to the menu, and a header number's own words win", () => {
		const site = {
			...testSite,
			phone: { ...testSite.phone, menuLabel: "Call / Text" },
		} as SiteConfig;
		for (const surface of ["light", "dark"] as const) {
			const shell = render(
				<SiteShell site={{ ...site, menu: { surface } }} currentPath="/about">
					<p>Page</p>
				</SiteShell>,
			);
			fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
			const menu = shell.container.querySelector("dialog") as HTMLElement;
			expect(
				within(menu).getByRole("link", { name: /^Call \/ Text\s+\(555\)/i }),
				surface,
			).toBeInTheDocument();
			shell.unmount();
			const header = render(
				<SiteShell
					site={{
						...site,
						menu: { surface },
						header: { phones: [{ e164: "+15555550143", display: "(555) 555-0143" }] },
					}}
					currentPath="/about"
				>
					<p>Page</p>
				</SiteShell>,
			);
			fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
			const withNumbers = header.container.querySelector("dialog") as HTMLElement;
			expect(
				within(withNumbers).queryByRole("link", { name: /Call \/ Text/i }),
				surface,
			).toBeNull();
			expect(
				within(withNumbers).getByRole("link", { name: /^Call\s+\(555\) 555-0143$/i }),
				surface,
			).toBeInTheDocument();
			header.unmount();
		}
	});

	it("takes an empty list of numbers as none, on either sheet: the contact phone stands in", () => {
		for (const surface of ["light", "dark"] as const) {
			const { unmount } = render(
				<SiteMenu
					open
					onClose={() => {}}
					links={links}
					phones={[]}
					contact={{ phone }}
					surface={surface}
					brand={brand}
				/>,
			);
			expect(screen.getByRole("link", { name: /^Call\s+\(555\) 555-0100$/i })).toHaveAttribute(
				"href",
				`tel:${phone.e164}`,
			);
			unmount();
		}
	});

	it("marks the page being read with aria-current, as the dark sheet does", () => {
		render(
			<SiteMenu
				open
				onClose={() => {}}
				links={links}
				currentPath="/about"
				surface="light"
				brand={brand}
			/>,
		);
		expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
	});
});

describe("the dark sheet's call to action, drawn by Button", () => {
	/** The anchor's attributes and words, so the comparison ignores attribute order alone. */
	function shape(link: HTMLElement) {
		return {
			attributes: Object.fromEntries(
				Array.from(link.attributes, (attribute) => [attribute.name, attribute.value]),
			),
			html: link.innerHTML,
		};
	}

	it("draws exactly what the hand built anchor drew on an unchanged site", () => {
		const { unmount } = render(
			<SiteMenu
				open
				onClose={() => {}}
				links={links}
				primaryCTA={{ label: "Order", href: "/order" }}
			/>,
		);
		expect(shape(screen.getByRole("link", { name: "Order" }))).toEqual({
			attributes: { class: "btn btn-primary btn-lg mm-cta", href: "/order" },
			html: "Order",
		});
		unmount();
		render(<SiteMenu open onClose={() => {}} links={links} primaryCTA={primaryCTA} />);
		expect(shape(screen.getByRole("link", { name: "Book Now" }))).toEqual({
			attributes: {
				class: "btn btn-primary btn-lg mm-cta",
				href: "https://booking.example.com",
				target: "_blank",
				rel: "noopener",
			},
			html: "Book Now",
		});
	});

	it("takes the base path and holds a phone number whole, as Button does", () => {
		const { unmount } = render(
			<BasePathProvider base="/proto">
				<SiteMenu
					open
					onClose={() => {}}
					links={links}
					primaryCTA={{ label: "Order", href: "/order" }}
				/>
			</BasePathProvider>,
		);
		expect(screen.getByRole("link", { name: "Order" })).toHaveAttribute("href", "/proto/order");
		unmount();
		render(
			<SiteMenu
				open
				onClose={() => {}}
				links={links}
				primaryCTA={{ label: "Call (555) 555-0100", href: "tel:+15555550100" }}
			/>,
		);
		const call = screen.getByRole("link", { name: "Call (555) 555-0100" });
		expect(call.querySelector(".tel-number")?.textContent).toBe("(555) 555-0100");
	});
});
