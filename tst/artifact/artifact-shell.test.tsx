import { render, screen, within } from "@testing-library/react";
import { ArtifactShell } from "../../src/artifact/ArtifactShell";
import type { ArtifactConfig } from "../../src/artifact/artifactConfig";

const testSite: ArtifactConfig = {
	url: "https://example.atelic.me",
	access: "public",
	sender: {
		name: "Test Sender",
		href: "https://sender.example",
		logo: { alt: "Test Sender", tile: "t", wordmark: "test", run: true },
		email: "hello@sender.example",
	},
	recipient: { name: "Test Business" },
};

function renderShell(props: Partial<Parameters<typeof ArtifactShell>[0]> = {}) {
	return render(
		<ArtifactShell site={testSite} currentPath="/report" {...props}>
			<p>Document body</p>
		</ArtifactShell>,
	);
}

/*
 * The chrome's own behavior (the menu dialog, Escape, the scroll spy) is
 * tested with the chrome. What is worth locking here is the composition:
 * the dark header with the sender's lockup and nothing else, the page's stops
 * when it has them, and the credit band alone at the foot, never a footer.
 */
describe("ArtifactShell", () => {
	it("renders the dark header with the sender's lockup, the document, and the credit band beneath it", () => {
		const { container } = renderShell();

		const header = screen.getByRole("banner");
		expect(header).toHaveClass("is-solid", "nav-dark");
		expect(within(header).getByRole("link", { name: "Test Sender home" })).toHaveAttribute(
			"href",
			"https://sender.example",
		);
		expect(within(header).getByText("test")).toHaveClass("wordmark");

		const main = screen.getByText("Document body").closest("main");
		expect(main).toHaveAttribute("id", "main");

		const credit = container.querySelector(".credit-bar");
		expect(credit).not.toBeNull();
		expect(credit?.textContent).toContain("in Denver by");
		expect(main?.compareDocumentPosition(credit as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
	});

	it("never renders a footer, a sticky CTA bar, a site nav, or a CTA", () => {
		const { container } = renderShell({ stops: [{ id: "one", label: "One" }] });
		expect(screen.queryByRole("contentinfo")).toBeNull();
		expect(container.querySelector(".sticky-cta")).toBeNull();
		expect(screen.queryByRole("navigation", { name: "Primary" })).toBeNull();
		expect(container.querySelector(".nav-cta")).toBeNull();
		expect(container.querySelector(".mm-cta")).toBeNull();
	});

	it("puts the page's stops in the header and the menu", () => {
		const { container } = renderShell({
			stops: [
				{ id: "one", label: "One" },
				{ id: "two", label: "Two" },
			],
		});
		const stops = screen.getByRole("navigation", { name: "Page sections" });
		expect(within(stops).getByRole("link", { name: "One" })).toHaveAttribute("href", "#one");
		expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
		const menuLinks = container.querySelectorAll("dialog.mobile-menu .mm-link");
		expect(Array.from(menuLinks, (link) => link.getAttribute("href"))).toEqual(["#one", "#two"]);
	});

	it("wears the sender's lockup alone when the config names no recipient logo", () => {
		const { container } = renderShell();
		const header = screen.getByRole("banner");
		expect(within(header).getByRole("link", { name: "Test Sender home" })).toBeInTheDocument();
		expect(container.querySelector(".nav-x")).toBeNull();
		expect(container.querySelector(".nav-recipient")).toBeNull();
	});

	it("names both parties when the config sets recipient.logo: the sender, a times sign, the recipient's mark", () => {
		const { container } = render(
			<ArtifactShell
				currentPath="/report"
				site={{
					...testSite,
					recipient: {
						name: "Test Business",
						logo: { src: "/brand/test-business.svg", alt: "Test Business" },
					},
				}}
			>
				<p>Document body</p>
			</ArtifactShell>,
		);
		const header = screen.getByRole("banner");
		const lockup = within(header).getByRole("link", { name: "Test Sender × Test Business home" });
		expect(lockup).toHaveAttribute("href", "https://sender.example");
		expect(lockup.querySelector(".nav-x")).toHaveTextContent("×");
		const mark = lockup.querySelector("img.nav-recipient");
		expect(mark).toHaveAttribute("src", "/brand/test-business.svg");
		expect(mark).toHaveAttribute("alt", "Test Business");
		// The sender's half is untouched: the wordmark, then the recipient after it.
		const wordmark = within(lockup).getByText("test");
		expect(wordmark.compareDocumentPosition(mark as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
		expect(container.querySelectorAll(".nav-recipient")).toHaveLength(1);
	});

	it("drops the stops, the burger, and the menu on a document with no stops", () => {
		const { container } = renderShell();
		expect(screen.queryByRole("navigation")).toBeNull();
		expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
		expect(container.querySelector("dialog.mobile-menu")).toBeNull();
	});
});
