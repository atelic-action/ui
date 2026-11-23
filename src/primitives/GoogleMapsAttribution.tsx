/**
 * The attribution Google's terms ask for wherever its Places suggestions
 * show without a Google map: the words "Google Maps", never modified,
 * translated, or wrapped (`translate="no"`), at 12 to 16 pixels in a regular
 * weight. The terms prefer Google's logo where there is room; a site that
 * draws it passes its own node as `AddressSearch`'s `attribution` instead.
 */
export function GoogleMapsAttribution() {
	return (
		<span className="google-maps-attribution" translate="no">
			Google Maps
		</span>
	);
}
