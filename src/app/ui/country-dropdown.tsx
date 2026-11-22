"use client";
import { countries as countryList } from "country-data-list";
import { CheckIcon, ChevronDown, Globe } from "lucide-react";
import { forwardRef, useCallback, useEffect, useState } from "react";
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
	/** The open list's accessible name, on the popover and its search. Defaults to "Countries". */
	ariaLabel?: string;
}

// The current, assigned countries (the data marks each with an emoji, which
// is only the filter here: a country is shown by its name and nothing else),
// excluding deleted entries. North Korea (PRK) is excluded for sanctions
// compliance.
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
					<span className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-left">
						{selectedCountry.name}
					</span>
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
								<span className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
									Not specified
								</span>
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
										<span className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap">
											{option.name}
										</span>
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
