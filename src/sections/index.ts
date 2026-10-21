/**
 * `@atelic-action/ui/sections`: the page scale sections a marketing site
 * composes, moved here from template-marketing in 0.19.0 (ATE-643), with the
 * `SiteConfig` contract they and `SiteShell` read. Their styles are
 * `@atelic-action/ui/styles/sections.css`; a section imports no stylesheet of
 * its own.
 */
export { isHoneypotFilled } from "../lib/honeypot";
export { formatClock, formatHoursRange, isClosed } from "../lib/hours";
export { type EventParams, trackEvent } from "../lib/trackEvent";
export { BlogIndex, type BlogIndexItem, type BlogIndexProps } from "./BlogIndex";
export { BlogPost, type BlogPostDoc, type BlogPostProps } from "./BlogPost";
export {
	type ComparisonRow,
	type ComparisonState,
	ComparisonTable,
	type ComparisonTableProps,
} from "./ComparisonTable";
export { ContactForm, type ContactFormProps } from "./ContactForm";
export {
	ContactInfoCard,
	type ContactInfoCardProps,
	type ContactInfoCardSite,
	type ContactPhone,
} from "./ContactInfoCard";
export { type Credential, CredentialList, type CredentialListProps } from "./CredentialList";
export { CTABanner, type CTABannerCTA, type CTABannerProps } from "./CTABanner";
export { CTASection, type CTASectionProps } from "./CTASection";
export { type DeviceImage, DeviceShowcase, type DeviceShowcaseProps } from "./DeviceShowcase";
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
export { Gallery, type GalleryPhoto, type GalleryProps } from "./Gallery";
export { Hero, type HeroCTA, type HeroProps, type HeroTrustItem } from "./Hero";
export { HoursTable, type HoursTableProps } from "./HoursTable";
export { JumpRail, type JumpRailItem, type JumpRailProps } from "./JumpRail";
export { type LegalBlock, type LegalDoc, LegalPage, type LegalPageProps } from "./LegalPage";
export {
	LocationSection,
	type LocationSectionProps,
	type LocationSectionSite,
} from "./LocationSection";
export { type LocationEntry, Locations, type LocationsProps } from "./Locations";
export { LogoMarquee, type LogoMarqueeProps } from "./LogoMarquee";
export { MapEmbed, type MapEmbedProps, type MapEmbedSite } from "./MapEmbed";
export { MediaBand, type MediaBandProps } from "./MediaBand";
export { MenuList, type MenuListItem, type MenuListProps } from "./MenuList";
export { PageHero, type PageHeroProps } from "./PageHero";
export { type PressItem, PressQuotes, type PressQuotesProps, sortPress } from "./PressQuotes";
export { PricingBand, type PricingBandProps } from "./PricingBand";
export { PricingCard, type PricingCardProps } from "./PricingCard";
export { type ProcessStep, ProcessSteps, type ProcessStepsProps } from "./ProcessSteps";
export { ProfileCards, type ProfileCardsProps, type ProfileItem } from "./ProfileCards";
export { type RevealSlide, RevealSlider, type RevealSliderProps } from "./RevealSlider";
export { ReviewCarousel, type ReviewCarouselProps, type ReviewStat } from "./ReviewCarousel";
export { type ReviewItem, ReviewWall, type ReviewWallProps } from "./ReviewWall";
export { type SocialPhoto, SocialStrip, type SocialStripProps } from "./SocialStrip";
export { SplitSection, type SplitSectionProps } from "./SplitSection";
export type {
	Address,
	CTA,
	Founder,
	GateConfig,
	NavItem,
	OpeningHours,
	SiteConfig,
	SiteLink,
	SocialLink,
} from "./siteConfig";
