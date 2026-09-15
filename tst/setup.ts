import "@testing-library/jest-dom/vitest";

/*
 * jsdom ships HTMLDialogElement with none of its behavior. These stand ins
 * follow the platform closely enough for the menu's tests: `open` reflects
 * the attribute, showModal opens, and close closes and fires the close
 * event. Escape stays the platform's job, so a test fires the events a
 * browser would (see pressEscape in the menu tests). A test file running in
 * the node environment has no DOM, so there is nothing to patch.
 */
if (typeof HTMLDialogElement !== "undefined") {
	patchDialog(HTMLDialogElement.prototype);
}

function patchDialog(dialog: HTMLDialogElement) {
	if (!Object.getOwnPropertyDescriptor(dialog, "open")) {
		Object.defineProperty(dialog, "open", {
			configurable: true,
			get(this: HTMLDialogElement) {
				return this.hasAttribute("open");
			},
			set(this: HTMLDialogElement, value: boolean) {
				this.toggleAttribute("open", value);
			},
		});
	}

	if (typeof dialog.showModal !== "function") {
		dialog.showModal = function showModal(this: HTMLDialogElement) {
			this.setAttribute("open", "");
		};
	}

	if (typeof dialog.close !== "function") {
		dialog.close = function close(this: HTMLDialogElement) {
			if (!this.hasAttribute("open")) return;
			this.removeAttribute("open");
			this.dispatchEvent(new Event("close"));
		};
	}
}
