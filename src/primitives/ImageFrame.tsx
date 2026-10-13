import type { CSSProperties } from "react";
import { useWithBase } from "../routing/BasePathProvider";

export interface ImageFrameProps {
	src?: string;
	alt?: string;
	/** CSS aspect-ratio for the frame, e.g. "4/5". */
	aspectRatio?: string;
	maxWidth?: string;
	/** Placeholder label rendered when no src is provided yet. */
	placeholder?: string;
	/** Set on above-the-fold imagery; defaults to lazy loading. */
	priority?: boolean;
	className?: string;
	style?: CSSProperties;
}

/** Rounded, shadowed media frame; renders a labeled placeholder block until an image exists. */
export function ImageFrame({
	src,
	alt = "",
	aspectRatio,
	maxWidth,
	placeholder,
	priority = false,
	className,
	style,
}: ImageFrameProps) {
	const withBase = useWithBase();
	const frameStyle: CSSProperties = { aspectRatio, maxWidth, ...style };
	if (!src) {
		return (
			<div className={["ph", className].filter(Boolean).join(" ")} style={frameStyle}>
				{placeholder ?? "Image"}
			</div>
		);
	}
	return (
		<div className={["imgframe", className].filter(Boolean).join(" ")} style={frameStyle}>
			<img
				src={withBase(src)}
				alt={alt}
				loading={priority ? undefined : "lazy"}
				fetchPriority={priority ? "high" : undefined}
			/>
		</div>
	);
}
