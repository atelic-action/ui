import { useWithBase } from "../routing/BasePathProvider";

export interface DeviceImage {
	src: string;
	alt: string;
}

export interface DeviceShowcaseProps {
	/** Desktop screenshot, shown inside a browser window frame. */
	desktop: DeviceImage;
	/** Phone screenshot, shown in a device frame overlapping the desktop. */
	phone: DeviceImage;
}

/**
 * A desktop browser mockup with a phone mockup overlapping its lower-left,
 * for showing a rebuilt site the way it will actually look. Reusable; both
 * images arrive via props.
 */
export function DeviceShowcase({ desktop, phone }: DeviceShowcaseProps) {
	const withBase = useWithBase();
	return (
		<div className="devices">
			<div className="dv-desktop">
				<div className="dv-bar">
					<i />
					<i />
					<i />
				</div>
				<div className="dv-screen">
					<img src={withBase(desktop.src)} alt={desktop.alt} loading="lazy" />
				</div>
			</div>
			<div className="dv-phone">
				<img src={withBase(phone.src)} alt={phone.alt} loading="lazy" />
			</div>
		</div>
	);
}
