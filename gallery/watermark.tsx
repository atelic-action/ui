import { useEffect, useState } from "react";
import { Watermark } from "../src/components";
import { Example, Frame, Piece } from "./parts";

type Mode = "pill" | "tiled";

/** A made up reader, on a reserved test domain. */
const READER = "reader@example.test";

/**
 * Writes the two cookies a verified sign in link sets, so the watermark has a
 * reader to stamp. The gallery has no gate; these cookies open nothing, and
 * the key remounts the watermark so it reads the mode afresh.
 */
function useGateCookies(mode: Mode): number {
	const [stamp, setStamp] = useState(0);
	useEffect(() => {
		// biome-ignore lint/suspicious/noDocumentCookie: the watermark reads these exact cookies, and the gallery plays the part of the gate that sets them
		document.cookie = `gate_email=${encodeURIComponent(READER)}; path=/; SameSite=Lax`;
		// biome-ignore lint/suspicious/noDocumentCookie: as above
		document.cookie = `gate_wm=${mode}; path=/; SameSite=Lax`;
		setStamp((was) => was + 1);
	}, [mode]);
	return stamp;
}

export function WatermarkPiece() {
	const [mode, setMode] = useState<Mode>("pill");
	const stamp = useGateCookies(mode);
	return (
		<Piece
			id="watermark"
			title="Watermark"
			lead="The confidential stamp on every page behind the access gate: the signed in reader's address in a corner pill, and in tiled mode faint across the whole page as well. It reads the gate's cookies and draws nothing without a session. This frame plays a page behind the gate for a made up reader."
		>
			<Example caption="A page behind the gate">
				<label className="gallery-select">
					<span>Mode</span>
					<select value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
						<option value="pill">Pill</option>
						<option value="tiled">Tiled</option>
					</select>
				</label>
				<Frame height={260}>
					<div className="gallery-frame-page">
						<p>The writeup, the proposal, or the preview a reader signed in to see.</p>
					</div>
					{stamp > 0 && <Watermark key={`${mode}-${stamp}`} />}
				</Frame>
			</Example>
		</Piece>
	);
}
