"use client";
import { countries as countryList } from "country-data-list";
import { CheckIcon, ChevronDown, Globe } from "lucide-react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { CircleFlag } from "react-circle-flags";
import { useOptionalAppConfig } from "../context/AppContext";
import { cn } from "../lib/utils";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type Country = {
	alpha2: string;
	alpha3: string;
	countryCallingCodes: string[];
	currencies: string[];
	emoji?: string;
	ioc: string;
	languages: string[];
	name: string;
	status: string;
};

interface CountryDropdownProps {
	id?: string;
	value?: string;
	onChange?: (value: string) => void;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	/**
	 * Where the flags load from, a base address ending in a slash (each flag
	 * at `<base><code>.svg`). Defaults to the app config's `flagsBaseURL`;
	 * with neither, no flag is fetched and the country's code is drawn in a
	 * plain circle.
	 */
	flagsBaseURL?: string;
	/** The open list's accessible name, on the popover and its search. Defaults to "Countries". */
	ariaLabel?: string;
}

// Filter to countries with emoji support, excluding deleted entries.
// North Korea (PRK) excluded due to international sanctions compliance.
const defaultOptions: Country[] = countryList.all.filter(
	(country: Country) => country.emoji && country.status !== "deleted" && country.ioc !== "PRK",
);

interface CountryFlagProps {
	country: Country;
	/** Pixels, the flag's width and height. */
	size: number;
	flagsBaseURL?: string;
	/** Load the image only once its row scrolls into the list's view. */
	lazy?: boolean;
}

/**
 * Whether a lazy element has come within reach of its scrolling list. An
 * element that is not lazy, or a browser with no IntersectionObserver, counts
 * as seen at once.
 */
function useSeen<T extends Element>(lazy: boolean) {
	const ref = useRef<T>(null);
	const [seen, setSeen] = useState(!lazy);
	useEffect(() => {
		if (seen) return;
		const node = ref.current;
		if (!node) return;
		if (typeof IntersectionObserver === "undefined") {
			setSeen(true);
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setSeen(true);
					observer.disconnect();
				}
			},
			{ root: node.closest("[cmdk-list]"), rootMargin: "64px 0px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [seen]);
	return [ref, seen] as const;
}

/**
 * One country's round flag, decorative: the country's name is always beside
 * it or on the element around it. The image comes from the app's own flag
 * host and only once it is in view; with no host, or when the image fails,
 * the country's code is drawn in a plain circle.
 */
function CountryFlag({ country, size, flagsBaseURL, lazy = false }: CountryFlagProps) {
	const configured = useOptionalAppConfig()?.flagsBaseURL;
	const base = flagsBaseURL ?? configured;
	const [ref, seen] = useSeen<HTMLSpanElement>(lazy);
	const code = country.alpha2.toLowerCase();
	// A failure belongs to one flag at one host, so it is forgotten when either changes.
	const attempt = `${code}:${base ?? ""}`;
	const [failedAttempt, setFailedAttempt] = useState<string | null>(null);
	const failed = failedAttempt === attempt;
	const drawImage = Boolean(base) && seen && !failed;
	return (
		<span
			ref={ref}
			aria-hidden="true"
			className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
			style={{ width: size, height: size }}
		>
			{drawImage ? (
				<CircleFlag
					countryCode={code}
					cdnUrl={base && !base.endsWith("/") ? `${base}/` : base}
					height={size}
					width={size}
					alt=""
					title={country.name}
					decoding="async"
					onError={() => setFailedAttempt(attempt)}
				/>
			) : (
				<span
					data-flag-fallback=""
					className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium leading-none text-muted-foreground"
					style={{ fontSize: Math.max(8, Math.round(size * 0.45)) }}
				>
					{country.alpha2.toUpperCase()}
				</span>
			)}
		</span>
	);
}

const CountryDropdownComponent = (
	{
		id,
		value,
		onChange,
		disabled = false,
		placeholder = "Select country",
		className,
		flagsBaseURL,
		ariaLabel = "Countries",
	}: CountryDropdownProps,
	ref: React.ForwardedRef<HTMLButtonElement>,
) => {
	const [open, setOpen] = useState(false);
	const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

	useEffect(() => {
		if (!value) {
			setSelectedCountry(null);
			return;
		}
		const country = defaultOptions.find((c) => c.name === value || c.alpha2 === value);
		setSelectedCountry(country ?? null);
	}, [value]);

	const handleSelect = useCallback(
		(country: Country) => {
			setSelectedCountry(country);
			onChange?.(country.name);
			setOpen(false);
		},
		[onChange],
	);

	const handleClear = useCallback(() => {
		setSelectedCountry(null);
		onChange?.("");
		setOpen(false);
	}, [onChange]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				id={id}
				ref={ref}
				className={cn(
					"flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 hover:bg-secondary/80",
					className,
				)}
				disabled={disabled}
			>
				{selectedCountry ? (
					<div className="flex items-center flex-grow gap-2 overflow-hidden">
						<CountryFlag country={selectedCountry} size={20} flagsBaseURL={flagsBaseURL} />
						<span className="overflow-hidden text-ellipsis whitespace-nowrap">
							{selectedCountry.name}
						</span>
					</div>
				) : (
					<span className="flex items-center gap-2 text-muted-foreground">
						<Globe size={16} aria-hidden="true" />
						{placeholder}
					</span>
				)}
				<ChevronDown size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
			</PopoverTrigger>
			<PopoverContent
				collisionPadding={10}
				side="bottom"
				aria-label={ariaLabel}
				className="min-w-(--radix-popper-anchor-width) p-0"
			>
				{/* The search sits above the list, never inside it: the list is a
				    listbox, which may hold only its options. */}
				<Command label={ariaLabel} className="w-full max-h-[200px] sm:max-h-[270px]">
					<CommandInput placeholder="Search country..." />
					<CommandList className="min-h-0 flex-1">
						<CommandEmpty>No country found.</CommandEmpty>
						<CommandGroup>
							<CommandItem className="flex items-center w-full gap-2" onSelect={handleClear}>
								<div className="flex flex-grow space-x-2 overflow-hidden">
									<div className="inline-flex items-center justify-center w-5 h-5 shrink-0">
										<Globe size={16} className="text-muted-foreground" aria-hidden="true" />
									</div>
									<span className="overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
										Not specified
									</span>
								</div>
								<CheckIcon
									aria-hidden="true"
									className={cn(
										"ml-auto h-4 w-4 shrink-0",
										!selectedCountry ? "opacity-100" : "opacity-0",
									)}
								/>
							</CommandItem>
							{defaultOptions
								.filter((x) => x.name)
								.map((option) => (
									<CommandItem
										className="flex items-center w-full gap-2"
										key={option.alpha3}
										onSelect={() => handleSelect(option)}
									>
										<div className="flex flex-grow space-x-2 overflow-hidden">
											<CountryFlag country={option} size={20} flagsBaseURL={flagsBaseURL} lazy />
											<span className="overflow-hidden text-ellipsis whitespace-nowrap">
												{option.name}
											</span>
										</div>
										<CheckIcon
											aria-hidden="true"
											className={cn(
												"ml-auto h-4 w-4 shrink-0",
												selectedCountry?.alpha3 === option.alpha3 ? "opacity-100" : "opacity-0",
											)}
										/>
									</CommandItem>
								))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

CountryDropdownComponent.displayName = "CountryDropdown";
export const CountryDropdown = forwardRef(CountryDropdownComponent);

/**
 * A country's flag by its name, as an image named for the country. The flag
 * loads from `flagsBaseURL`, or the app config's when it is omitted; with
 * neither, nothing is fetched and the country's code is drawn in a plain
 * circle. Null for a name the list does not know.
 */
export function getCountryFlag(countryName: string, flagsBaseURL?: string): React.ReactNode {
	const country = defaultOptions.find((c) => c.name === countryName);
	if (!country) return null;
	return (
		<span role="img" aria-label={country.name} className="inline-flex shrink-0">
			<CountryFlag country={country} size={16} flagsBaseURL={flagsBaseURL} />
		</span>
	);
}
