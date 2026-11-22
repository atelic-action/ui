import type { ReactNode } from "react";
import { Eyebrow } from "../primitives";
import { ImageFrame } from "../primitives/ImageFrame";

export interface ProcessStep {
	title: string;
	description: string;
}

export interface ProcessStepsProps {
	eyebrow?: string;
	title: ReactNode;
	steps: ProcessStep[];
	image?: { src: string; alt: string };
	/** Placeholder label rendered in the media frame until a real image exists. */
	placeholder?: string;
	/** The band's id, so a nav entry or a jump link can land on it. */
	id?: string;
	/**
	 * The level of the band's title; each step's title sits one below it, so
	 * the outline never skips a level. Defaults to 2, a band on a page whose
	 * `h1` is the hero's; a band inside a deeper outline passes its own.
	 */
	headingLevel?: 2 | 3 | 4 | 5;
}

/** Dark band with numbered steps and supporting media. */
export function ProcessSteps({
	eyebrow,
	title,
	steps,
	image,
	placeholder,
	id,
	headingLevel = 2,
}: ProcessStepsProps) {
	const Title = `h${headingLevel}` as const;
	const StepTitle = `h${(headingLevel + 1) as 3 | 4 | 5 | 6}` as const;
	return (
		<section className="section process" id={id}>
			<div className="wrap process-grid">
				<div>
					{eyebrow && <Eyebrow onDark>{eyebrow}</Eyebrow>}
					<Title className="process-title">{title}</Title>
					<ol className="steps">
						{steps.map((step, i) => (
							<li key={step.title}>
								<span className="step-n">{i + 1}</span>
								<div>
									<StepTitle className="step-title">{step.title}</StepTitle>
									<p>{step.description}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
				<div className="process-media">
					<ImageFrame src={image?.src} alt={image?.alt} placeholder={placeholder} />
				</div>
			</div>
		</section>
	);
}
