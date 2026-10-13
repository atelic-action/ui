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
}

/** Dark band with numbered steps and supporting media. */
export function ProcessSteps({ eyebrow, title, steps, image, placeholder }: ProcessStepsProps) {
	return (
		<section className="section process">
			<div className="wrap process-grid">
				<div>
					{eyebrow && <Eyebrow onDark>{eyebrow}</Eyebrow>}
					<h2>{title}</h2>
					<ol className="steps">
						{steps.map((step, i) => (
							<li key={step.title}>
								<span className="step-n">{i + 1}</span>
								<div>
									<h4>{step.title}</h4>
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
