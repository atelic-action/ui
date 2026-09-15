import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { SiteMenu, type SiteMenuProps } from "../../src/chrome";
import { address, email, links, phone, primaryCTA } from "../fixtures";

type HarnessProps = Omit<SiteMenuProps, "open" | "onClose"> & { onClose?: () => void };

/** Holds the open state the way SiteHeader does, so a close really closes. */
function Harness({ onClose, ...props }: HarnessProps) {
	const [open, setOpen] = useState(true);
	return (
		<SiteMenu
			{...props}
			open={open}
			onClose={() => {
				setOpen(false);
				onClose?.();
			}}
		/>
	);
}

function getDialog(container: HTMLElement): HTMLDialogElement {
	const dialog = container.querySelector("dialog");
	if (!dialog) throw new Error("the menu rendered no dialog");
	return dialog;
}

/**
 * What a browser does on Escape in a modal dialog: fire cancel, then close
 * the dialog (firing close) unless cancel was prevented. jsdom does neither.
 */
function pressEscape(dialog: HTMLDialogElement) {
	act(() => {
		const proceed = dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
		if (proceed) dialog.close();
	});
}

/** jsdom cannot navigate; swallow anchor defaults so a click does not try. */
function swallowNavigation(container: HTMLElement) {
	container.addEventListener("click", (event) => event.preventDefault());
}

describe("SiteMenu", () => {
	it("opens as a modal dialog", () => {
		const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
		const { container } = render(<SiteMenu open onClose={() => {}} links={links} />);

		const dialog = getDialog(container);
		expect(showModal).toHaveBeenCalledTimes(1);
		expect(dialog.open).toBe(true);
		expect(dialog).toHaveClass("mobile-menu");
		showModal.mockRestore();
	});

	it("renders closed, and opens nothing, until asked", () => {
		const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
		const { container } = render(<SiteMenu open={false} onClose={() => {}} links={links} />);

		expect(getDialog(container).open).toBe(false);
		expect(showModal).not.toHaveBeenCalled();
		showModal.mockRestore();
	});

	it("closes on Escape and fires the close callback once", () => {
		const onClose = vi.fn();
		const { container } = render(<Harness links={links} onClose={onClose} />);
		const dialog = getDialog(container);
		expect(dialog.open).toBe(true);

		pressEscape(dialog);

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(dialog.open).toBe(false);
	});

	it("closes when a link is followed", () => {
		const onClose = vi.fn();
		const { container } = render(<Harness links={links} onClose={onClose} />);
		const dialog = getDialog(container);
		swallowNavigation(container);

		fireEvent.click(within(dialog).getByRole("link", { name: /About/ }));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(dialog.open).toBe(false);
	});

	it("closes when the CTA is followed", () => {
		const onClose = vi.fn();
		const { container } = render(
			<Harness links={links} primaryCTA={primaryCTA} onClose={onClose} />,
		);
		swallowNavigation(container);

		fireEvent.click(screen.getByRole("link", { name: "Book Now" }));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(getDialog(container).open).toBe(false);
	});

	it("closes from its own close button", () => {
		const onClose = vi.fn();
		const { container } = render(<Harness links={links} onClose={onClose} />);
		const dialog = getDialog(container);

		fireEvent.click(within(dialog).getByRole("button", { name: "Close menu" }));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(dialog.open).toBe(false);
	});

	it("closes when the owner asks, without reporting that close back", () => {
		const onClose = vi.fn();
		const { container, rerender } = render(<SiteMenu open onClose={onClose} links={links} />);
		const dialog = getDialog(container);
		expect(dialog.open).toBe(true);

		rerender(<SiteMenu open={false} onClose={onClose} links={links} />);

		expect(dialog.open).toBe(false);
		expect(onClose).not.toHaveBeenCalled();
	});

	it("renders every entry as a menu link with its index", () => {
		render(<SiteMenu open onClose={() => {}} links={links} />);
		const menuLinks = screen
			.getAllByRole("link")
			.filter((link) => link.classList.contains("mm-link"));
		expect(menuLinks).toHaveLength(links.length);
		expect(menuLinks[0]).toHaveTextContent("Home");
		expect(menuLinks[0]?.querySelector(".idx")).toHaveTextContent("01");
	});

	it("renders the CTA as a standard button, unpolluted by menu link styling", () => {
		render(<SiteMenu open onClose={() => {}} links={links} primaryCTA={primaryCTA} />);
		const button = screen.getByRole("link", { name: "Book Now" });
		expect(button).toHaveClass("btn", "btn-primary", "btn-lg", "mm-CTA");
		expect(button).not.toHaveClass("mm-link");
		expect(button).toHaveAttribute("target", "_blank");
		expect(button).toHaveAttribute("rel", "noopener");
	});

	it("renders the contact block when given one, and nothing when not", () => {
		const { container, unmount } = render(
			<SiteMenu open onClose={() => {}} links={links} contact={{ phone, email, address }} />,
		);
		const contact = container.querySelector(".mm-contact")?.textContent ?? "";
		expect(contact).toContain("(555) 555-0100");
		expect(contact).toContain(email);
		expect(contact).toContain("123 MAIN ST · DENVER, CO 80205");
		unmount();

		const without = render(<SiteMenu open onClose={() => {}} links={links} />);
		expect(without.container.querySelector(".mm-contact")).toBeNull();
	});

	it("skips the street and its separator when the business publishes none", () => {
		const serviceArea = { ...address, street: "", postalCode: "" };
		const { container } = render(
			<SiteMenu open onClose={() => {}} links={links} contact={{ email, address: serviceArea }} />,
		);
		const contact = container.querySelector(".mm-contact")?.textContent ?? "";
		expect(contact).not.toContain("·");
		expect(contact).toContain("DENVER, CO");
	});
});
