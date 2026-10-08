import { useEffect, useState } from "react";
import { readCookie } from "../lib/readCookie";

/**
 * The confidential watermark stamped on every page behind the access gate.
 * Reads the signed in viewer's email from the readable `gate_email` cookie
 * (set when a sign in link is verified) and paints a corner pill, plus a
 * faint tiled overlay when the gate runs in "tiled" mode. Renders nothing
 * when there is no session, so it is inert on a public site and during
 * prerender. The email travels into any screenshot.
 *
 * It deters and attributes; it does not enforce. The cookies it reads are
 * unsigned and it is drawn in the reader's own browser.
 */
export function Watermark() {
	const [email, setEmail] = useState("");
	const [mode, setMode] = useState("pill");

	useEffect(() => {
		setEmail(readCookie("gate_email"));
		setMode(readCookie("gate_wm") || "pill");
	}, []);

	if (!email) return null;

	return (
		<>
			{mode === "tiled" && (
				<div className="gate-wm-tile-layer" aria-hidden="true">
					{Array.from({ length: 32 }).map((_, index) => {
						const row = Math.floor(index / 4);
						const col = index % 4;
						return (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: fixed static grid, order is stable
								key={index}
								className="gate-wm-tile"
								style={{ top: `${row * 13 + 2}%`, left: `${col * 27 - 6 + (row % 2 ? 13 : 0)}%` }}
							>
								confidential · {email}
							</span>
						);
					})}
				</div>
			)}
			<div className="gate-wm" aria-hidden="true">
				<span className="gate-wm-dot" />
				<span className="gate-wm-text">
					Confidential preview · <b>{email}</b>
				</span>
			</div>
		</>
	);
}
