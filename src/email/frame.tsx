import { Fragment, type ReactNode } from "react";
import { Card } from "./atoms";
import { asciiDowncase } from "./text";
import { eyebrowStyle, fadeStop, tableReset, useEmailTheme } from "./theme";

/*
 * The frame, ported one to one from the frame section of homebase
 * `runners/lib/email.jq`. The page shell itself is not a component: it is a
 * template string in render.tsx, because React emits no doctype and hoists
 * head tags.
 */

export type MastheadProps = {
	title: string;
	/** The wordmark at the top left. */
	wordmark?: string;
};

/**
 * The wordmark and one orange rule at the top left, the email's title beside
 * them: the runner's name, not the week.
 */
export function Masthead({ title, wordmark = "atelic" }: MastheadProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td style={{ padding: "8px 8px 22px", fontFamily: fonts.sans }}>
				<table {...tableReset}>
					<tbody>
						<tr>
							<td
								style={{
									fontSize: "20px",
									fontWeight: "600",
									letterSpacing: "-0.045em",
									color: palette.ink,
									paddingRight: "8px",
									lineHeight: "1",
								}}
							>
								{wordmark}
							</td>
							<td
								width="34"
								style={{ width: "34px", verticalAlign: "middle", paddingRight: "12px" }}
							>
								<div
									style={{
										width: "34px",
										height: "2px",
										fontSize: "0",
										lineHeight: "0",
										backgroundColor: palette.accent,
										background: `linear-gradient(90deg,${palette.accent},${fadeStop(palette.accent)})`,
									}}
								>
									{"\u00a0"}
								</div>
							</td>
							<td
								style={{
									...eyebrowStyle(fonts),
									color: palette.faint,
									verticalAlign: "middle",
									lineHeight: "1",
								}}
							>
								{title}
							</td>
						</tr>
					</tbody>
				</table>
			</td>
		</tr>
	);
}

export type TitleCardProps = {
	eyebrowText: string;
	/** One to three short lines, broken between them. */
	headlineLines: string[];
	lede?: string;
	/** Whatever rows the runner hands in under the lede: a StatsRow, a Scoreboard. */
	stats?: ReactNode;
};

/** The title card: an eyebrow, a headline, a lede, and the runner's own rows. */
export function TitleCard({ eyebrowText, headlineLines, lede, stats }: TitleCardProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<Card>
			<tr>
				<td style={{ padding: "26px 26px 6px", ...eyebrowStyle(fonts), color: palette.faint }}>
					{eyebrowText}
				</td>
			</tr>
			<tr>
				<td
					style={{
						padding: "0 26px",
						fontFamily: fonts.sans,
						fontSize: "30px",
						fontWeight: "600",
						letterSpacing: "-0.03em",
						lineHeight: "1.1",
						color: palette.ink,
					}}
				>
					{headlineLines.map((line, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: a line's position is its identity
						<Fragment key={i}>
							{i > 0 ? <br /> : null}
							{line}
						</Fragment>
					))}
				</td>
			</tr>
			{lede ? (
				<tr>
					<td
						style={{
							padding: `14px 26px ${stats ? "0" : "26px"}`,
							fontFamily: fonts.sans,
							fontSize: "15px",
							lineHeight: "1.6",
							color: palette.dim,
						}}
					>
						{lede}
					</td>
				</tr>
			) : null}
			{stats}
		</Card>
	);
}

export type FooterProps = { meta: string };

/** One quiet line at the foot: the run's facts. */
export function Footer({ meta }: FooterProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td
				style={{
					padding: "36px 8px 0",
					fontFamily: fonts.mono,
					fontSize: "11px",
					lineHeight: "1.8",
					color: palette.faint,
				}}
			>
				{meta}
			</td>
		</tr>
	);
}

export type FailurePageProps = {
	runnerTitle: string;
	eyebrowText: string;
	reason: string;
	logTail: string;
};

/**
 * The body rows of the failure page, in the same cream, so a bad week reads
 * like a good one with the reason on top and the log's tail beneath.
 */
export function FailurePage({ runnerTitle, eyebrowText, reason, logTail }: FailurePageProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<>
			<Masthead title={runnerTitle} />
			<Card>
				<tr>
					<td style={{ padding: "26px 26px 6px", ...eyebrowStyle(fonts), color: palette.faint }}>
						{eyebrowText}
					</td>
				</tr>
				<tr>
					<td
						style={{
							padding: "0 26px",
							fontFamily: fonts.sans,
							fontSize: "30px",
							fontWeight: "600",
							letterSpacing: "-0.03em",
							lineHeight: "1.1",
							color: palette.ink,
						}}
					>
						{`The ${asciiDowncase(runnerTitle)} did not run.`}
					</td>
				</tr>
				<tr>
					<td
						style={{
							padding: "14px 26px 0",
							fontFamily: fonts.sans,
							fontSize: "15px",
							lineHeight: "1.6",
							color: palette.dim,
						}}
					>
						{reason}
					</td>
				</tr>
				<tr>
					<td style={{ padding: "20px 26px 26px" }}>
						<pre
							style={{
								fontFamily: fonts.mono,
								fontSize: "12px",
								whiteSpace: "pre-wrap",
								color: palette.dim,
								borderTop: `1px solid ${palette.line}`,
								paddingTop: "14px",
								margin: "0",
							}}
						>
							{logTail}
						</pre>
					</td>
				</tr>
			</Card>
		</>
	);
}
