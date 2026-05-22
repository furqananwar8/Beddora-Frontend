"use client";

import { Controller, type Control, type Path } from "react-hook-form";
import * as SelectPrimitive from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps<T extends Record<string, any>> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: FormSelectOption[];
  placeholder?: string;
}

export function FormSelect<T extends Record<string, any>>({
  control,
  name,
  label,
  options,
  placeholder,
}: FormSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <label className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <span>{label}</span>
          <SelectPrimitive.Select.Root
            value={String(field.value ?? "")}
            onValueChange={(next) => field.onChange(next)}
          >
            <SelectPrimitive.Select.Trigger
              className={cn(
                "h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm text-zinc-900 shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-zinc-700 dark:bg-input/30 dark:text-zinc-100",
                fieldState.error && "border-destructive"
              )}
              aria-label={label}
            >
              <SelectPrimitive.Select.Value placeholder={placeholder ?? "Select a role"} />
              <SelectPrimitive.Select.Icon className="text-zinc-400">
                <ChevronDown className="h-4 w-4" />
              </SelectPrimitive.Select.Icon>
            </SelectPrimitive.Select.Trigger>

            <SelectPrimitive.Select.Portal>
              <SelectPrimitive.Select.Positioner>
                <SelectPrimitive.Select.Popup className="z-50 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                  <SelectPrimitive.Select.List className="max-h-60 overflow-y-auto">
                    {options.map((option) => (
                      <SelectPrimitive.Select.Item
                        key={option.value}
                        value={option.value}
                        className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none transition hover:bg-zinc-100 data-selected:bg-indigo-600 data-selected:text-white dark:text-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <SelectPrimitive.Select.ItemText>{option.label}</SelectPrimitive.Select.ItemText>
                        <SelectPrimitive.Select.ItemIndicator>
                          <Check className="h-4 w-4" />
                        </SelectPrimitive.Select.ItemIndicator>
                      </SelectPrimitive.Select.Item>
                    ))}
                  </SelectPrimitive.Select.List>
                  <SelectPrimitive.Select.Arrow className="text-zinc-200 dark:text-zinc-700" />
                </SelectPrimitive.Select.Popup>
              </SelectPrimitive.Select.Positioner>
            </SelectPrimitive.Select.Portal>
          </SelectPrimitive.Select.Root>

          {fieldState.error ? (
            <span className="text-xs text-destructive">{fieldState.error.message}</span>
          ) : null}
        </label>
      )}
    />
  );
}
