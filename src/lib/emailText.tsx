import { Fragment, type ReactNode } from "react";

/**
 * An email address with its break opportunities marked: after the @ and
 * before each dot of the domain, so a narrow column wraps it there and
 * never inside a word ("hello@" / "kestrelhollow" / ".example.com"). The
 * words read and copy exactly as the address.
 */
export function breakableEmail(email: string): ReactNode {
	const at = email.indexOf("@");
	if (at === -1) return email;
	const [first, ...rest] = email.slice(at + 1).split(".");
	return (
		<>
			{email.slice(0, at + 1)}
			<wbr />
			{first}
			{rest.map((part, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: the parts of one address never reorder
				<Fragment key={index}>
					<wbr />.{part}
				</Fragment>
			))}
		</>
	);
}
