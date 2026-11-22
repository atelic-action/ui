import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import {
	BigFold,
	Card,
	type Day,
	DayStrip,
	EmailThemeProvider,
	Eyebrow,
	FoldRow,
	Footer,
	GroupRow,
	Item,
	LeadRow,
	List,
	Masthead,
	Note,
	ReadBlock,
	RecordStack,
	Records,
	Row,
	Scoreboard,
	Stat,
	StatsRow,
	SubEyebrow,
	TargetRow,
	TitleCard,
} from "../../src/email";
import { renderEmail } from "../../src/email/render";
import { atelicPalette, type Palette } from "../../src/tokens";
import { wholesaleRecords } from "../fixtures/email-app";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

const week: Day[] = [
	{ label: "Mon", entries: [{ name: "Rye" }, { name: "Country", strong: true }] },
	{ label: "Tue", entries: [{ name: "Buns" }] },
	{ label: "Wed", entries: [] },
	{ label: "Thu", entries: [{ name: "Knots", badge: "S" }] },
	{ label: "Fri", entries: [{ name: "Seeded", strong: true }] },
	{ label: "Sat", entries: [{ name: "Buns" }, { name: "Knots" }] },
	{ label: "Sun", entries: [] },
];

/** The bakery's weekly operations email, every piece in the order a runner sends them. */
function Report() {
	return (
		<>
			<Masthead title="Weekly Ops" meta="2026-W47" />
			<TitleCard
				eyebrowText="The week"
				headlineLines={["Thirteen out the door,", "two still proofing."]}
				lede="The earliest first drop this month, and Larkspur wants Saturdays."
				stats={
					<StatsRow>
						<Stat n={13} caption="orders out" />
						<Stat n={41} caption="trays" />
						<Stat n="06:15" caption="first drop" />
					</StatsRow>
				}
			/>
			<Eyebrow text="Targets" strong aside={<span>4 of 6 met</span>} />
			<Card>
				<ReadBlock text="Visits are short of the week's target; the tastings carried it." divider />
				<Scoreboard>
					<GroupRow text="Outreach" first />
					<TargetRow text="Cafe visits" logged={3} target={5} note="two booked" last={false} />
					<TargetRow text="Tastings" logged={2} target={2} note="" last />
					<GroupRow text="Kitchen" first={false} />
					<TargetRow text="Recipe tests" logged={1} target={3} note="oven down Tue" last />
				</Scoreboard>
				<Row last>
					<span />
				</Row>
			</Card>
			<Eyebrow text="Wholesale" />
			<Card>
				<Row last>
					<RecordStack records={wholesaleRecords} />
				</Row>
			</Card>
			<Eyebrow text="Drops" />
			<Card>
				<Row last>
					<Records
						columns={[
							{ label: "Cafe" },
							{ label: "Trays", right: true },
							{ label: "Drop", right: true },
						]}
						rows={[
							[{ value: "Larkspur" }, { value: "4", mono: true }, { value: "06:15", mono: true }],
							[
								{ value: "Wicket Lane" },
								{ value: "1", mono: true },
								{ value: "07:30", mono: true },
							],
							[{ value: "Fairhaven" }, { value: "2", mono: true }, { value: "07:00", mono: true }],
						]}
					/>
				</Row>
			</Card>
			<Eyebrow text="The bakes" />
			<Card>
				<SubEyebrow text="Mon to Sun" />
				<DayStrip days={week} last={false} />
				<Item
					name="Cardamom knots"
					right="new"
					subparts={["Thursday", "Saturday"]}
					body="A first tray for the market, and Larkspur asked to try them."
					foldLabel="the formula"
					foldBody="Brioche dough at 20% butter, cardamom sugar, a cold overnight proof."
					last={false}
				/>
				<FoldRow last={false}>
					<BigFold summary="What moved" count="3">
						<List fontSize="13px">
							<LeadRow lead="Larkspur" rest="added a Saturday tray." />
							<LeadRow lead="Fairhaven" rest="moved to Wednesday and Friday." />
							<LeadRow lead="Alder Street" rest="paused for the refit." />
						</List>
					</BigFold>
				</FoldRow>
				<Note
					eyebrowText="Act on it"
					text="Send Fairhaven the spring price sheet before the trial ends."
					accented
					last
				/>
			</Card>
			<Footer meta="weekly-ops · ran 2026-11-16 05:02 · 41 orders read · 3.2s" />
		</>
	);
}

/** A client branded palette: the bakery's own, in place of the practice's. */
const kestrelPalette: Palette = {
	...atelicPalette,
	ground: "#F3EEE4",
	paper: "#FFFDF8",
	ink: "#1F2A24",
	dim: "#4A5249",
	faint: "#5F665A",
	accent: "#7A3218",
	warm: "#8A5A12",
};

/**
 * A whole report email assembled from the pieces, as a runner sends it: the
 * masthead, the title card and its stats, a scoreboard under its read, the
 * wholesale records, a drops table, the week's strip, an item with a fold, a
 * card level fold, a note, and the footer. The pieces' faint and accent inks
 * fail contrast on the palette, so the atelic stories are marked; the client
 * palette's darker inks pass.
 */
const meta = {
	title: "Email/WeeklyReport",
	component: Report,
	decorators: [inColumn],
	globals: pin("desktop"),
} satisfies Meta<typeof Report>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At a mail client's 600 column: every piece fits it, and the folds open. */
export const MailClient: Story = {
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	play: async ({ canvas, canvasElement, step }) => {
		await step("every piece fits the 600 column", async () => {
			await expect(
				Math.round(
					canvasElement.querySelector("[data-story-column]")?.getBoundingClientRect().width ?? 0,
				),
			).toBe(600);
			await fitsTheColumn(canvasElement);
		});
		await step("the card level fold opens on a press, and still fits", async () => {
			await userEvent.click(canvas.getByText(/What moved/));
			await expect(canvas.getByText("Alder Street")).toBeVisible();
			await fitsTheColumn(canvasElement);
		});
	},
};

/** At phone width the whole email fits the screen and nothing scrolls sideways. */
export const Phone: Story = {
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	globals: pin("phone"),
	play: async ({ canvas, canvasElement }) => {
		await userEvent.click(canvas.getByText(/What moved/));
		await userEvent.click(canvas.getByText(/the formula/));
		await fitsTheColumn(canvasElement);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/**
 * The same email in a client's palette, through the theme provider: the
 * bakery's darker faint and accent inks pass contrast, so the check stays on.
 */
export const ClientPalette: Story = {
	decorators: [
		(Story) => (
			<EmailThemeProvider palette={kestrelPalette}>
				<Story />
			</EmailThemeProvider>
		),
		inColumn,
	],
	play: async ({ canvas, canvasElement }) => {
		await expect(getComputedStyle(canvas.getByText("The week")).color).toBe("rgb(95, 102, 90)");
		await fitsTheColumn(canvasElement);
	},
};

/** The sent document itself: the email as `renderEmail` writes it, in a frame of a given width. */
function Sent({ width }: { width: number }) {
	const html = renderEmail({
		title: "Weekly Ops: 2026-W47",
		preheader: "Thirteen out the door.",
		children: <Report />,
	});
	return (
		<tr>
			<td>
				<iframe
					title="The weekly ops email"
					srcDoc={html}
					style={{ width, height: 900, border: 0 }}
				/>
			</td>
		</tr>
	);
}

async function sentDocument(canvasElement: HTMLElement) {
	const frame = canvasElement.querySelector("iframe") as HTMLIFrameElement;
	await waitFor(() =>
		expect(frame.contentDocument?.body?.textContent).toContain("Thirteen out the door"),
	);
	return frame.contentDocument as Document;
}

/**
 * The rendered document at a desktop client's width: its 680 column, the
 * preheader hidden, the page's own ground. The check does not reach into the
 * frame (stories/findings/email-app.md, Checker Limits).
 */
export const SentDocument: Story = {
	decorators: [],
	render: () => <Sent width={760} />,
	play: async ({ canvasElement }) => {
		const doc = await sentDocument(canvasElement);
		const view = doc.defaultView as Window;
		await expect(doc.documentElement.scrollWidth).toBeLessThanOrEqual(view.innerWidth);
		await expect(doc.title).toBe("Weekly Ops: 2026-W47");
	},
};

/**
 * The rendered document on a phone: its own media query lets the 680 column
 * take the phone's width, and nothing scrolls sideways.
 */
export const SentDocumentPhone: Story = {
	decorators: [],
	globals: pin("phone"),
	render: () => <Sent width={366} />,
	play: async ({ canvasElement }) => {
		const doc = await sentDocument(canvasElement);
		const view = doc.defaultView as Window;
		await expect(doc.documentElement.scrollWidth).toBeLessThanOrEqual(view.innerWidth);
	},
};
