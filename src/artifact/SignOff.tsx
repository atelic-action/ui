import { Mail } from "lucide-react";
import type { ReactNode } from "react";

export interface WriteupPerson {
	photoSrc: string;
	photoAlt: string;
	name: string;
	/** The line under the name, e.g. <>Founder, <a href="https://atelic.me">Atelic</a></>. */
	role: ReactNode;
	mailHref: string;
	/** The address as printed, e.g. "matt@atelic.me". */
	mailLabel: string;
}

/**
 * The sign off a printed artifact closes on: the script line, then the person
 * lockup, the photo beside the name, the role, and the address
 * (Brand/voice.md, Pitch Surfaces 9). The writeup and the monthly page both
 * wear it, so its styles live in the base sheet chain
 * (styles/artifact.css); its container sets the type size and the color.
 */
export function SignOff({ signOff, person }: { signOff: string; person: WriteupPerson }) {
	return (
		<div className="op-who">
			<img src={person.photoSrc} alt={person.photoAlt} />
			<div>
				<div className="op-sign">{signOff}</div>
				<b>{person.name}</b>
				<br />
				{person.role} ·{" "}
				<a href={person.mailHref}>
					<Mail size={11} aria-hidden="true" /> {person.mailLabel}
				</a>
			</div>
		</div>
	);
}
