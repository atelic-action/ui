import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders its children inside an iframe the play function can resize, so a
 * sweep across widths meets the media queries a page that wide meets (the
 * viewport a story pins holds still for the whole play). The iframe takes
 * a copy of the page's stylesheets and an `.atelic-ui` root, so what it
 * draws is what a site draws at that width.
 *
 *   render: (args) => <SizedFrame width={360}><Footer {...args} /></SizedFrame>
 *
 * The play finds the iframe by its test id (`sized-frame`) and reads its
 * document; `frameOf` does both.
 */
export function SizedFrame({
	width,
	height = 1600,
	children,
}: {
	width: number;
	height?: number;
	children: ReactNode;
}) {
	const frameRef = useRef<HTMLIFrameElement>(null);
	const [root, setRoot] = useState<HTMLElement | null>(null);
	useLayoutEffect(() => {
		const doc = frameRef.current?.contentDocument;
		if (!doc) return;
		for (const sheet of Array.from(
			document.head.querySelectorAll('style, link[rel="stylesheet"]'),
		)) {
			doc.head.appendChild(sheet.cloneNode(true));
		}
		doc.body.style.margin = "0";
		const host = doc.createElement("div");
		host.className = "atelic-ui";
		doc.body.appendChild(host);
		setRoot(host);
		// The sheets too, so a second run of the effect (StrictMode) adds them once.
		return () => {
			host.remove();
			doc.head.replaceChildren();
		};
	}, []);
	return (
		<iframe
			ref={frameRef}
			data-testid="sized-frame"
			title="Sized frame"
			style={{ width, height, border: 0, display: "block" }}
		>
			{root && createPortal(children, root)}
		</iframe>
	);
}

/** The sized frame of a story, and the document inside it. */
export function frameOf(canvasElement: HTMLElement) {
	const frame = canvasElement.querySelector<HTMLIFrameElement>('[data-testid="sized-frame"]');
	const doc = frame?.contentDocument;
	if (!frame || !doc) throw new Error("No sized frame in this story");
	return { frame, doc };
}
