"use client";

import type * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import {
	Controller,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
	FormProvider,
	useFormContext,
} from "react-hook-form";
import { cn } from "../lib/utils";
import { Label } from "./label";

const Form = FormProvider;

type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const { getFieldState, formState } = useFormContext();

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>");
	}

	if (!itemContext) {
		throw new Error("useFormField should be used within <FormItem>");
	}

	const fieldState = getFieldState(fieldContext.name, formState);

	const { id, parts } = itemContext;

	return {
		id,
		parts,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

/** Which of a field's describing parts are on the page right now. */
type FormItemParts = { description: boolean; message: boolean };

type FormItemContextValue = {
	id: string;
	parts: FormItemParts;
	/** A describing part reports itself as it mounts and as it leaves. */
	setPart: (part: keyof FormItemParts, present: boolean) => void;
};

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

/** A describing part of a field, which tells its item whether it is on the page. */
function useFormItemPart(part: keyof FormItemParts, present: boolean) {
	const field = useFormField();
	const setPart = React.useContext(FormItemContext)?.setPart;
	React.useEffect(() => {
		if (!setPart) return;
		setPart(part, present);
		return () => setPart(part, false);
	}, [setPart, part, present]);
	return field;
}

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		const id = React.useId();
		const [parts, setParts] = React.useState<FormItemParts>({
			description: false,
			message: false,
		});
		const setPart = React.useCallback((part: keyof FormItemParts, present: boolean) => {
			setParts((current) =>
				current[part] === present ? current : { ...current, [part]: present },
			);
		}, []);
		const value = React.useMemo(() => ({ id, parts, setPart }), [id, parts, setPart]);

		return (
			<FormItemContext.Provider value={value}>
				<div ref={ref} className={cn("space-y-2", className)} {...props} />
			</FormItemContext.Provider>
		);
	},
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
	const { error, formItemId } = useFormField();

	return (
		<Label
			ref={ref}
			className={cn(error && "text-destructive", className)}
			htmlFor={formItemId}
			{...props}
		/>
	);
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
	React.ElementRef<typeof Slot>,
	React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
	const { error, formItemId, formDescriptionId, formMessageId, parts } = useFormField();
	// Only the parts on the page: a reference to a description or a message
	// that never rendered points at nothing.
	const describedBy =
		[parts.description && formDescriptionId, parts.message && formMessageId]
			.filter(Boolean)
			.join(" ") || undefined;

	return (
		<Slot
			ref={ref}
			id={formItemId}
			aria-describedby={describedBy}
			aria-invalid={!!error}
			{...props}
		/>
	);
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
	const { formDescriptionId } = useFormItemPart("description", true);

	return (
		<p
			ref={ref}
			id={formDescriptionId}
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
	const field = useFormField();
	const body = field.error ? String(field.error?.message ?? "") : children;
	const { formMessageId } = useFormItemPart("message", Boolean(body));

	if (!body) {
		return null;
	}

	return (
		<p
			ref={ref}
			id={formMessageId}
			className={cn("text-sm font-medium text-destructive", className)}
			{...props}
		>
			{body}
		</p>
	);
});
FormMessage.displayName = "FormMessage";

export {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	useFormField,
};
