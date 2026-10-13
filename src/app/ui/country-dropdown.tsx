"use client";
import { countries as countryList } from "country-data-list";
import { CheckIcon, ChevronDown, Globe } from "lucide-react";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { CircleFlag } from "react-circle-flags";
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
}

// Filter to countries with emoji support, excluding deleted entries.
// North Korea (PRK) excluded due to international sanctions compliance.
const defaultOptions: Country[] = countryList.all.filter(
	(country: Country) => country.emoji && country.status !== "deleted" && country.ioc !== "PRK",
);

const CountryDropdownComponent = (
	{
		id,
		value,
		onChange,
		disabled = false,
		placeholder = "Select country",
		className,
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
						<div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
							<CircleFlag countryCode={selectedCountry.alpha2.toLowerCase()} height={20} />
						</div>
						<span className="overflow-hidden text-ellipsis whitespace-nowrap">
							{selectedCountry.name}
						</span>
					</div>
				) : (
					<span className="flex items-center gap-2 text-muted-foreground">
						<Globe size={16} />
						{placeholder}
					</span>
				)}
				<ChevronDown size={16} className="shrink-0 text-muted-foreground" />
			</PopoverTrigger>
			<PopoverContent
				collisionPadding={10}
				side="bottom"
				className="min-w-[--radix-popper-anchor-width] p-0"
			>
				<Command className="w-full max-h-[200px] sm:max-h-[270px]">
					<CommandList>
						<div className="sticky top-0 z-10 bg-popover">
							<CommandInput placeholder="Search country..." />
						</div>
						<CommandEmpty>No country found.</CommandEmpty>
						<CommandGroup>
							<CommandItem className="flex items-center w-full gap-2" onSelect={handleClear}>
								<div className="flex flex-grow space-x-2 overflow-hidden">
									<div className="inline-flex items-center justify-center w-5 h-5 shrink-0">
										<Globe size={16} className="text-muted-foreground" />
									</div>
									<span className="overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
										Not specified
									</span>
								</div>
								<CheckIcon
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
											<div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
												<CircleFlag countryCode={option.alpha2.toLowerCase()} height={20} />
											</div>
											<span className="overflow-hidden text-ellipsis whitespace-nowrap">
												{option.name}
											</span>
										</div>
										<CheckIcon
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
 * Get the flag component for a country name.
 */
export function getCountryFlag(countryName: string): React.ReactNode {
	const country = defaultOptions.find((c) => c.name === countryName);
	if (!country) return null;
	return (
		<span className="inline-flex items-center justify-center w-4 h-4 shrink-0 overflow-hidden rounded-full">
			<CircleFlag countryCode={country.alpha2.toLowerCase()} height={16} />
		</span>
	);
}
