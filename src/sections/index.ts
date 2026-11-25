/**
 * `@atelic-action/ui/sections`: the page scale sections a marketing site
 * composes, moved here from template-marketing in 0.19.0 (ATE-643), with the
 * `SiteConfig` contract they and `SiteShell` read. Their styles are
 * `@atelic-action/ui/styles/sections.css`; a section imports no stylesheet of
 * its own.
 */

export {
	type ContactFormField,
	type ContactFormValues,
	isPhoneNumber,
	isZIP,
} from "../lib/contactForm";
export { isHoneypotFilled } from "../lib/honeypot";
export { type ClockOptions, formatClock, formatHoursRange, isClosed } from "../lib/hours";
export { type EventParams, trackEvent } from "../lib/trackEvent";
export { BlogIndex, type BlogIndexItem, type BlogIndexProps } from "./BlogIndex";
export { BlogPost, type BlogPostDoc, type BlogPostProps } from "./BlogPost";
export {
	CalloutPanel,
	type CalloutPanelItem,
	type CalloutPanelProps,
} from "./CalloutPanel";
export {
	type ComparisonRow,
	type ComparisonState,
	ComparisonTable,
	type ComparisonTableProps,
} from "./ComparisonTable";
export {
	ContactForm,
	type ContactFormAddress,
	type ContactFormConsent,
	type ContactFormLabels,
	type ContactFormPlaceholders,
	type ContactFormProps,
	type ContactFormThanks,
} from "./ContactForm";
export {
	ContactInfoCard,
	type ContactInfoCardProps,
	type ContactInfoCardSite,
	type ContactPhone,
} from "./ContactInfoCard";
export { ContactSection, type ContactSectionProps } from "./ContactSection";
export { type Credential, CredentialList, type CredentialListProps } from "./CredentialList";
export { CTASection, type CTASectionProps } from "./CTASection";
export { ExpandList, type ExpandListItem, type ExpandListProps } from "./ExpandList";
export {
	FAQBrowser,
	type FAQBrowserProps,
	type FAQCategory,
	type FAQCTA,
	type FAQEntry,
} from "./FAQBrowser";
export { FeatureDetail, type FeatureDetailProps } from "./FeatureDetail";
export { type FeatureCard, FeatureGrid, type FeatureGridProps } from "./FeatureGrid";
export { FullBleedVideo, type FullBleedVideoProps } from "./FullBleedVideo";
export { Gallery, type GalleryPhoto, type GalleryProps } from "./Gallery";
export { Hero, type HeroCTA, type HeroProps, type HeroTrustItem } from "./Hero";
export { HoursTable, type HoursTableProps } from "./HoursTable";
export {
	type InfoRow,
	type InfoRowAction,
	type InfoRowIcon,
	InfoRows,
	type InfoRowsProps,
} from "./InfoRows";
export { JumpRail, type JumpRailItem, type JumpRailProps } from "./JumpRail";
export { type LegalBlock, type LegalDoc, LegalPage, type LegalPageProps } from "./LegalPage";
export {
	type LinkColumn,
	type LinkColumnLink,
	LinkColumns,
	type LinkColumnsProps,
} from "./LinkColumns";
export {
	LocationSection,
	type LocationSectionProps,
	type LocationSectionSite,
} from "./LocationSection";
export { type LocationEntry, Locations, type LocationsProps } from "./Locations";
export { LogoMarquee, type LogoMarqueeProps } from "./LogoMarquee";
export { MapEmbed, type MapEmbedProps, type MapEmbedSite } from "./MapEmbed";
export { PageHero, type PageHeroProps } from "./PageHero";
export { PricingBand, type PricingBandProps } from "./PricingBand";
export { PricingCard, type PricingCardProps } from "./PricingCard";
export { type ProcessStep, ProcessSteps, type ProcessStepsProps } from "./ProcessSteps";
export { ProfileCards, type ProfileCardsProps, type ProfileItem } from "./ProfileCards";
export { type ProofItem, ProofStrip, type ProofStripProps } from "./ProofStrip";
export { type RevealSlide, RevealSlider, type RevealSliderProps } from "./RevealSlider";
export { ReviewCarousel, type ReviewCarouselProps, type ReviewStat } from "./ReviewCarousel";
export { type ReviewItem, ReviewWall, type ReviewWallProps } from "./ReviewWall";
export { SplitSection, type SplitSectionProps } from "./SplitSection";
export type {
	Address,
	Clock,
	CTA,
	Density,
	Founder,
	GateConfig,
	NavItem,
	OpeningHours,
	SiteConfig,
	SiteLink,
	SocialLink,
	Surface,
} from "./siteConfig";
