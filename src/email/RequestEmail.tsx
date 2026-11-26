import {
	type RequestEmailLook,
	type RequestEmailRequest,
	requestEmailCard,
	requestEmailContent,
	requestEmailLook,
	type ScheduleConfirmationOptions,
} from "../forms/requestEmail";
import type { ScheduleConfig } from "../forms/scheduleConfig";
import { accentInk, useEmailTheme } from "./theme";

export interface RequestEmailProps {
	/** What the request asked for, as the endpoint read it. */
	request: RequestEmailRequest;
	/** The business's one config: its phone, its promise, and its words for each way. */
	config: ScheduleConfig;
	/** The business's name, its logo and address, the foot, and whether to repeat what was typed. */
	options: ScheduleConfirmationOptions & { brandName: string };
}

/**
 * The customer's confirmation of a schedule request, as an email row: it
 * says the request arrived, that it is a request and not a booked
 * appointment, what was asked for, what happens next and when the office
 * confirms, and how to call sooner. The card is the one the endpoint sends
 * (`scheduleRequestEmail`'s markup, tables and inline styles), mounted here
 * so a page, a story, and the design system show exactly what a customer
 * receives. Its colors come from the email theme's palette unless the
 * options' `look` names its own.
 */
export function RequestEmail({ request, config, options }: RequestEmailProps) {
	const { palette, fonts } = useEmailTheme();
	const fromTheme: RequestEmailLook = {
		font: fonts.sans,
		ink: palette.ink,
		quiet: palette.dim,
		accent: accentInk(palette),
		onAccent: "#ffffff",
		tint: palette.ground,
		paper: palette.paper,
		ground: palette.ground,
		line: palette.line,
	};
	const look = requestEmailLook({ ...fromTheme, ...options.look });
	const card = requestEmailCard(requestEmailContent(request, config, options), look);
	return (
		<tr>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: the one card the endpoint mails, every word in it escaped by requestEmailCard */}
			<td style={{ padding: "0 0 24px" }} dangerouslySetInnerHTML={{ __html: card }} />
		</tr>
	);
}
