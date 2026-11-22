import { render, screen, within } from "@testing-library/react";
import { SiteShell } from "../../src/chrome";
import type { SiteConfig } from "../../src/sections";
import { testSite } from "../sections/site-fixture";

function renderShell(site: SiteConfig, props: Partial<Parameters<typeof SiteShell>[0]> = {}) {
	return render(
		<SiteShell site={site} currentPath="/about" {...props}>
			<p>Page body</p>
		</SiteShell>,
	);
}

const grouped: SiteConfig = {
	...testSite,
	basePath: "/proto",
	nav: [
		{
			label: "Services",
			to: "/services",
			columns: [{ heading: "Repair", links: [{ label: "Patch", href: "/services/patch" }] }],
			feature: {
				title: "A headline",
				cta: { label: "Get a quote", href: "/quote" },
				image: { src: "/images/feature.jpg", alt: "A finished job" },
			},
		},
		{ label: "About", to: "/about" },
	],
};

describe("SiteShell density, groups, numbers, and the dock", () => {
	it("leaves the default density unmarked and sets any other on the root", () => {
		const plain = renderShell(testSite);
		expect(plain.container.firstElementChild).not.toHaveAttribute("data-density");
		plain.unmount();

		const roomy = renderShell({ ...testSite, density: "comfortable" });
		expect(roomy.container.firstElementChild).toHaveAttribute("data-density", "comfortable");
		roomy.unmount();

		const tight = renderShell({ ...testSite, density: "comfortable" }, { density: "compact" });
		expect(tight.container.firstElementChild).toHaveAttribute("data-density", "compact");
	});

	it("carries a group into the header with every link based, and keeps its links out of the footer", () => {
		const { container } = renderShell(grouped, { currentPath: "/proto/about" });
		const control = screen.getByRole("button", { name: "Services" });
		const panel = document.getElementById(control.getAttribute("aria-controls") ?? "");
		expect(panel?.querySelector('a[href="/proto/services/patch"]')).not.toBeNull();
		expect(panel?.querySelector('a[href="/proto/quote"]')).not.toBeNull();
		expect(panel?.querySelector("img")).toHaveAttribute("src", "/proto/images/feature.jpg");

		const company = within(screen.getByRole("contentinfo")).getByRole("navigation", {
			name: "Company",
		});
		expect(within(company).getByRole("link", { name: "Services" })).toHaveAttribute(
			"href",
			"/proto/services",
		);
		expect(within(company).queryByRole("link", { name: "Patch" })).toBeNull();
		expect(container.querySelector(".mobile-menu .mm-group-btn")).toHaveTextContent("Services");
	});

	it("shows the config's header numbers", () => {
		const { container } = renderShell({
			...testSite,
			header: { phones: [{ e164: "+15555550100", display: "(555) 555-0100", label: "Main" }] },
		});
		expect(container.querySelector(".nav-phone")).toHaveAttribute("href", "tel:+15555550100");
	});

	it("mounts the dock when the config supplies one, and drops it on request", () => {
		const site: SiteConfig = {
			...testSite,
			basePath: "/proto",
			contactDock: {
				label: "Talk to us",
				items: [
					{ label: "Send a message", href: "/contact" },
					{ label: "Call", href: "tel:+15555550100" },
				],
			},
		};
		const shown = renderShell(site);
		expect(screen.getByRole("button", { name: "Talk to us" })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
		const dock = shown.container.querySelector(".contact-dock") as HTMLElement;
		expect(dock.querySelector('a[href="/proto/contact"]')).not.toBeNull();
		expect(dock.querySelector('a[href="tel:+15555550100"]')).not.toBeNull();
		shown.unmount();

		const none = renderShell(testSite);
		expect(none.container.querySelector(".contact-dock")).toBeNull();
		none.unmount();

		const off = renderShell(site, { contactDock: false });
		expect(off.container.querySelector(".contact-dock")).toBeNull();
	});
});
