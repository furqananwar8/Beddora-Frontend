"use client";

import { Label } from "@/components/ui/label";
import { memo, useState, useMemo } from "react";
import { useFieldController } from "./useFieldController";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const FormDate = memo(({ field: config }: { field: any }) => {
    const [open, setOpen] = useState(false);

    const { field, error } = useFieldController(config?.name);

    // console.log("field", field);
    // ✅ prevent invalid date mutation bug
    const minDate = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const handleSelect = (date: Date | undefined) => {
        field.onChange(date); // ✅ RHF-safe value
        field.onBlur(); // ✅ Trigger validation
        setOpen(false);
    };

    return (
        <div className={`${config.wrapperClassName} space-y-2`}>
            <Label className={error ? "text-red-500" : ""}>
                {config.label || "Date"}
            </Label>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        data-empty={!field.value}
                        className={`w-full justify-between text-left font-normal bg-white ${error ? "border-red-500 text-red-500 bg-red-50" : ""
                            }`}
                    >
                        {field.value ? (
                            format(new Date(field.value), "PPP")
                        ) : (
                            <span className={error ? "text-red-500" : "text-muted-foreground"}>Select Date</span>
                        )}

                        <CalendarIcon />
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        required
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date: any) => {
                            // console.log("date", date);
                            handleSelect(date)
                        }}

                        disabled={(date) => {
                            if (!config.futureDatesOnly || config.isEditing) return false;
                            return date < minDate;
                        }}
                    />
                </PopoverContent>
            </Popover>

            {error && <p className="text-xs text-red-500">{error.message}</p>}
        </div>
    );
});

export default FormDate;