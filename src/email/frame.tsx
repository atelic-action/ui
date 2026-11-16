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
	/**
	 * A quiet fact at the right end of the row, such as the week. It sits on
	 * the title's line while it fits and drops under it, still right aligned,
	 * when the row runs out of room.
	 */
	meta?: string;
};

/**
 * The wordmark and one orange rule at the top left, the email's title beside
 * them: the runner's name, not the week. A `meta` rides at the right end of
 * the row in its own right aligned, unbroken block, floated after the brand so
 * that on a narrow screen it drops under the title instead of squashing it.
 */
export function Masthead({ title, wordmark = "atelic", meta }: MastheadProps) {
	const { palette, fonts } = useEmailTheme();
	const brand = (
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
					<td width="34" style={{ width: "34px", verticalAlign: "middle", paddingRight: "12px" }}>
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
	);
	return (
		<tr>
			<td style={{ padding: "8px 8px 22px", fontFamily: fonts.sans }}>
				{meta ? (
					<>
						<div style={{ display: "inline-block", verticalAlign: "middle" }}>{brand}</div>
						<div
							style={{
								float: "right",
								textAlign: "right",
								whiteSpace: "nowrap",
								...eyebrowStyle(fonts),
								lineHeight: "20px",
								color: palette.faint,
							}}
						>
							{meta}
						</div>
					</>
				) : (
					brand
				)}
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
	/** What failed, as a short label ("Claude model call"). */
	step?: string;
	/** What to do about it, a sentence or two that may hold a command. */
	fix?: string;
};

/** True for a string with something in it besides whitespace. */
function filled(value: string | undefined): value is string {
	return value !== undefined && value.trim() !== "";
}

type FailureFact = { label: string; value: string; kind: "step" | "reason" | "fix" };

/**
 * The body rows of the failure page, in the same cream, so a bad week reads
 * like a good one with the reason on top and the log's tail beneath. With a
 * `step` or a `fix` the reason becomes a labelled block of what failed, why,
 * and what to do, and the log sits under its own label; without either the
 * page is exactly the plain one.
 */
export function FailurePage({
	runnerTitle,
	eyebrowText,
	reason,
	logTail,
	step,
	fix,
}: FailurePageProps) {
	const { palette, fonts } = useEmailTheme();
	if (filled(step) || filled(fix)) {
		return (
			<StructuredFailurePage
				runnerTitle={runnerTitle}
				eyebrowText={eyebrowText}
				reason={reason}
				logTail={logTail}
				step={step}
				fix={fix}
			/>
		);
	}
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

/**
 * The structured failure page: the same eyebrow and headline, then one row per
 * fact that has a value, each a faint eyebrow over its value on a hairline,
 * and the log's tail last under its own eyebrow. The fix's label wears the
 * accent, as an accented `Note` does, and its value is set in mono because it
 * so often holds a command.
 */
function StructuredFailurePage({
	runnerTitle,
	eyebrowText,
	reason,
	logTail,
	step,
	fix,
}: FailurePageProps) {
	const { palette, fonts } = useEmailTheme();
	const facts: FailureFact[] = [];
	if (filled(step)) facts.push({ label: "What Failed", value: step, kind: "step" });
	if (filled(reason)) facts.push({ label: "Why", value: reason, kind: "reason" });
	if (filled(fix)) facts.push({ label: "What to Do", value: fix, kind: "fix" });
	const hasLog = filled(logTail);
	const cell = { padding: "14px 0", borderTop: `1px solid ${palette.line}` };
	const valueStyle = (kind: FailureFact["kind"]) => {
		if (kind === "fix") {
			return {
				marginTop: "6px",
				fontFamily: fonts.mono,
				fontSize: "13px",
				lineHeight: "1.6",
				color: palette.ink,
				wordBreak: "break-word" as const,
			};
		}
		return {
			marginTop: "6px",
			fontFamily: fonts.sans,
			fontSize: "15px",
			lineHeight: "1.5",
			color: kind === "step" ? palette.ink : palette.dim,
			...(kind === "step" ? { fontWeight: "600" } : {}),
		};
	};
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
					<td style={{ padding: "22px 26px 12px" }}>
						<table {...tableReset} width="100%">
							<tbody>
								{facts.map((fact) => (
									<tr key={fact.kind}>
										<td style={cell}>
											<div
												style={{
													...eyebrowStyle(fonts),
													color: fact.kind === "fix" ? palette.accent : palette.faint,
												}}
											>
												{fact.label}
											</div>
											<div style={valueStyle(fact.kind)}>{fact.value}</div>
										</td>
									</tr>
								))}
								{hasLog ? (
									<tr>
										<td style={cell}>
											<div style={{ ...eyebrowStyle(fonts), color: palette.faint }}>Log</div>
											<pre
												style={{
													fontFamily: fonts.mono,
													fontSize: "12px",
													lineHeight: "1.5",
													whiteSpace: "pre-wrap",
													color: palette.dim,
													margin: "6px 0 0",
												}}
											>
												{logTail}
											</pre>
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</td>
				</tr>
			</Card>
		</>
	);
}
