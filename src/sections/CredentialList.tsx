export interface Credential {
	/** Short mono code, e.g. "DPT", "OCS". */
	code: string;
	title: string;
	detail?: string;
}

export interface CredentialListProps {
	items: Credential[];
	className?: string;
}

/** Card rows of credentials or certifications with mono code prefixes. */
export function CredentialList({ items, className }: CredentialListProps) {
	return (
		<ul className={["cert-list", className].filter(Boolean).join(" ")}>
			{items.map((item) => (
				<li key={item.code + item.title}>
					<span className="ci">{item.code}</span>
					<div>
						<strong>{item.title}</strong>
						{item.detail && <small>{item.detail}</small>}
					</div>
				</li>
			))}
		</ul>
	);
}
