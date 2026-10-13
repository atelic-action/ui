import { Croissant, Info, LayoutGrid, Plus, Printer, Wheat } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton, AppPage, Breadcrumbs, FormActionButtons } from "../../src/app";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Alert,
	AlertDescription,
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	AlertTitle,
	Avatar,
	AvatarFallback,
	Badge,
	BadgeList,
	Button,
	Callout,
	Card,
	CardContent,
	Checkbox,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CountryDropdown,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	Input,
	Label,
	OptionSelect,
	Pagination,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Progress,
	SearchInput,
	Separator,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
	Slider,
	Switch,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../../src/app/ui";

function Specimen({ label, children }: { label: string; children: ReactNode }) {
	return (
		<Card>
			<CardContent className="py-5">
				<p className="kit-label">{label}</p>
				{children}
			</CardContent>
		</Card>
	);
}

function OrderForm() {
	const form = useForm({ defaultValues: { customer: "Juniper Street Cafe", notes: "" } });
	return (
		<Form {...form}>
			<form className="flex flex-col gap-4" onSubmit={form.handleSubmit(() => form.reset())}>
				<FormField
					control={form.control}
					name="customer"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Customer</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormDescription>Who the order goes to.</FormDescription>
						</FormItem>
					)}
				/>
				<FormActionButtons onCancel={() => form.reset()} saveText="Save order" />
			</form>
		</Form>
	);
}

export function KitPage() {
	const [search, setSearch] = useState("rye");
	const [loaf, setLoaf] = useState("country");
	const [page, setPage] = useState(3);
	const [country, setCountry] = useState("Italy");

	return (
		<AppPage
			crumb={<Breadcrumbs items={[{ label: "Kit" }]} />}
			icon={<LayoutGrid className="h-7 w-7" />}
			title="Kit"
			subtitle="The shadcn pieces every page is set in."
		>
			<div className="ap-body kit-grid">
				<Specimen label="Button">
					<div className="flex flex-wrap gap-2">
						<Button>Bake</Button>
						<Button variant="secondary">Proof</Button>
						<Button variant="outline">Shape</Button>
						<Button variant="ghost">Rest</Button>
						<Button variant="destructive">Toss</Button>
						<Button variant="link">Recipe</Button>
						<Button size="icon" aria-label="Add a bake">
							<Plus />
						</Button>
					</div>
				</Specimen>

				<Specimen label="ActionButton">
					<div className="flex flex-wrap gap-2">
						<ActionButton icon={Printer} label="Print the bake sheet" />
						<ActionButton icon={Plus} label="New order" variant="default" />
					</div>
				</Specimen>

				<Specimen label="Badge and BadgeList">
					<div className="flex flex-col gap-3">
						<div className="flex flex-wrap gap-2">
							<Badge>Packed</Badge>
							<Badge variant="secondary">In the oven</Badge>
							<Badge variant="outline">Proofing</Badge>
							<Badge variant="destructive">Late</Badge>
						</div>
						<BadgeList
							items={[
								{ label: "Laminated", icon: <Croissant className="h-3 w-3" /> },
								{ label: "Whole grain", icon: <Wheat className="h-3 w-3" /> },
								{ label: "Vegan" },
								{ label: "Nut free" },
								{ label: "Seasonal" },
							]}
							maxDisplay={3}
						/>
					</div>
				</Specimen>

				<Specimen label="Alert and Callout">
					<div className="flex flex-col gap-3">
						<Alert>
							<Info className="h-4 w-4" />
							<AlertTitle>Flour arrives Thursday</AlertTitle>
							<AlertDescription>Twelve sacks of the high extraction.</AlertDescription>
						</Alert>
						<Alert variant="destructive">
							<AlertTitle>The second oven is down</AlertTitle>
							<AlertDescription>Loaves move to the deck until noon.</AlertDescription>
						</Alert>
						<Callout icon={<Info className="h-4 w-4" />}>
							Wholesale orders lock at 18:00 the night before.
						</Callout>
					</div>
				</Specimen>

				<Specimen label="Input, Label, SearchInput, Textarea">
					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="kit-batch">Batch size</Label>
							<Input id="kit-batch" defaultValue="48" inputMode="numeric" />
						</div>
						<SearchInput value={search} onValueChange={setSearch} placeholder="Search recipes" />
						<Textarea placeholder="A note for the morning shift" />
					</div>
				</Specimen>

				<Specimen label="Checkbox, Switch, Slider">
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-2">
							<Checkbox id="kit-egg" defaultChecked />
							<Label htmlFor="kit-egg">Egg wash</Label>
						</div>
						<div className="flex items-center gap-2">
							<Switch id="kit-steam" defaultChecked />
							<Label htmlFor="kit-steam">Steam the deck</Label>
						</div>
						<Slider defaultValue={[78]} max={100} step={1} aria-label="Hydration" />
					</div>
				</Specimen>

				<Specimen label="OptionSelect and Progress">
					<div className="flex flex-col gap-4">
						<OptionSelect
							value={loaf}
							onValueChange={setLoaf}
							ariaLabel="Loaf"
							className="w-full sm:w-56"
							options={[
								{ value: "country", label: "Country loaf" },
								{ value: "rye", label: "Rye" },
								{ value: "baguette", label: "Baguette" },
							]}
						/>
						<Progress value={64} aria-label="Ovens in use" />
					</div>
				</Specimen>

				<Specimen label="Accordion">
					<Accordion type="single" collapsible defaultValue="levain">
						<AccordionItem value="levain">
							<AccordionTrigger>Levain</AccordionTrigger>
							<AccordionContent>Fed at 22:00, ripe by 04:00.</AccordionContent>
						</AccordionItem>
						<AccordionItem value="dough">
							<AccordionTrigger>Final dough</AccordionTrigger>
							<AccordionContent>Mixed to 24 degrees, bulk for four hours.</AccordionContent>
						</AccordionItem>
					</Accordion>
				</Specimen>

				<Specimen label="Dialog, AlertDialog, Sheet">
					<div className="flex flex-wrap gap-2">
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="outline">Dialog</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Scale the batch</DialogTitle>
									<DialogDescription>Every ingredient moves with the yield.</DialogDescription>
								</DialogHeader>
								<Input defaultValue="96" aria-label="Yield" />
								<DialogFooter>
									<Button>Scale</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="outline">AlertDialog</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Cancel the order?</AlertDialogTitle>
									<AlertDialogDescription>
										Juniper Street Cafe will hear from you by email.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Keep it</AlertDialogCancel>
									<AlertDialogAction>Cancel the order</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<Sheet>
							<SheetTrigger asChild>
								<Button variant="outline">Sheet</Button>
							</SheetTrigger>
							<SheetContent>
								<SheetTitle>The bake sheet</SheetTitle>
								<SheetDescription>Everything in the oven before 08:00.</SheetDescription>
							</SheetContent>
						</Sheet>
					</div>
				</Specimen>

				<Specimen label="Popover, Tooltip, DropdownMenu">
					<div className="flex flex-wrap gap-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline">Popover</Button>
							</PopoverTrigger>
							<PopoverContent>Proof at 26 degrees for ninety minutes.</PopoverContent>
						</Popover>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="outline">Tooltip</Button>
								</TooltipTrigger>
								<TooltipContent>Shaped at 05:10</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">DropdownMenu</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuLabel>Order</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem>Duplicate</DropdownMenuItem>
								<DropdownMenuItem>Print label</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</Specimen>

				<Specimen label="Command, in a Popover">
					{/* Mounted only when open: cmdk scrolls its first item into view on mount. */}
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline">Find a recipe</Button>
						</PopoverTrigger>
						<PopoverContent className="p-0" align="start">
							<Command>
								<CommandInput placeholder="Find a recipe" />
								<CommandList>
									<CommandEmpty>Nothing by that name.</CommandEmpty>
									<CommandGroup heading="Breads">
										<CommandItem>Country loaf</CommandItem>
										<CommandItem>Baguette</CommandItem>
										<CommandItem>Rye</CommandItem>
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</Specimen>

				<Specimen label="Avatar, Separator, Pagination">
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<Avatar>
								<AvatarFallback>RD</AvatarFallback>
							</Avatar>
							<Avatar>
								<AvatarFallback>DO</AvatarFallback>
							</Avatar>
						</div>
						<Separator />
						<Pagination page={page} totalPages={9} onPageChange={setPage} />
					</div>
				</Specimen>

				<Specimen label="Form and FormActionButtons">
					<OrderForm />
				</Specimen>

				<Specimen label="CountryDropdown">
					<CountryDropdown value={country} onChange={setCountry} />
				</Specimen>
			</div>
		</AppPage>
	);
}
