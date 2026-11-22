import type { ReactNode } from "react";

/**
 * The page behind a piece of fixed chrome (a header, a sticky bar, a dock):
 * enough body to read the chrome against and to scroll. `hero` sets a dark
 * full screen band first, the way a home page sits under a transparent bar.
 * Its copy is the bakery's, and it is plain markup on purpose, so a story of
 * the chrome never depends on a section's behavior.
 */
export interface PageBehindProps {
	hero?: boolean;
	/**
	 * The hero band in one flat dark color rather than a gradient, for a
	 * story whose accessibility check measures words over it: axe cannot
	 * measure contrast over a gradient and leaves it unjudged.
	 */
	flatHero?: boolean;
	/** Three screens of body, for a story that scrolls. */
	tall?: boolean;
	children?: ReactNode;
}

export function PageBehind({
	hero = false,
	flatHero = false,
	tall = false,
	children,
}: PageBehindProps) {
	return (
		<main id="main" style={{ minHeight: tall ? "300vh" : "100vh" }}>
			{hero && (
				<div
					style={{
						minHeight: "100vh",
						display: "grid",
						placeItems: "center",
						background: flatHero ? "#1c1712" : "linear-gradient(160deg, #3a2a1c, #151515)",
						color: "#f4efe6",
					}}
				>
					<p style={{ fontSize: "1.6rem", fontWeight: 700 }}>
						Bread from the back of the shop, since 2014.
					</p>
				</div>
			)}
			<div className="wrap" style={{ paddingTop: "calc(var(--nav-height) + 32px)" }}>
				<h1>Country sourdough, rye, and the morning buns.</h1>
				<p>
					Baked in the back of the shop every day but Monday, and gone by the afternoon on a
					Saturday.
				</p>
				{children}
			</div>
		</main>
	);
}
