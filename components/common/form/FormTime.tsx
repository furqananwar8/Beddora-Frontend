"use client"

import { Label } from "@/components/ui/label"
import { memo } from "react"
import { useFieldController } from "./useFieldController"
import { Input } from "@/components/ui/input"
import { FormTimeProps } from "./fields.types"

const FormTime = memo(({ field: config, wrapperClassName }: { field: FormTimeProps, wrapperClassName?: string }) => {
    const { field: hourField, error: hourError } = useFieldController(config.hourName)
    const { field: minuteField, error: minuteError } = useFieldController(config.minuteName)
    const { field: ampmField, error: ampmError } = useFieldController(config.ampmName)
    return (
        <div className={`${config.wrapperClassName} space-y-2`}>
            <Label className="text-xs text-muted-foreground font-medium">
                {config.label}
            </Label>

            <div className="flex items-center gap-2">
                <Input
                    {...hourField}
                    type="number"
                    min={0}
                    max={11}
                    // onChange={(e) => {
                    //     const raw = e.target.value

                    //     // allow empty input
                    //     if (raw === "") {
                    //         hourField.onChange("")
                    //         return
                    //     }

                    //     const value = Number(raw)

                    //     // clamp safely
                    //     if (value < 0) {
                    //         hourField.onChange(0)
                    //     } else if (value > 11) {
                    //         hourField.onChange(11)
                    //     } else {
                    //         hourField.onChange(value)
                    //     }
                    // }}
                    // hide control buttons
                    className={`w-9 px-2 text-center border border-primary/10 ${hourError ? "border-red-500" : ""} [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                    value={hourField.value ?? ""}
                    disabled={config.disabled}
                />
                <span>:</span>

                <Input
                    {...minuteField}
                    type="number"
                    min={0}
                    max={59}
                    // onChange={(e) => {
                    //     const raw = e.target.value

                    //     // allow empty input
                    //     if (raw === "") {
                    //         minuteField.onChange("")
                    //         return
                    //     }

                    //     const value = Number(raw)

                    //     // clamp safely
                    //     if (value < 0) {
                    //         minuteField.onChange(0)
                    //     } else if (value > 59) {
                    //         minuteField.onChange(59)
                    //     } else {
                    //         minuteField.onChange(value)
                    //     }
                    // }}
                    className={`w-9 px-2 border border-primary/10 text-center ${minuteError ? "border-red-500" : ""} [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                    value={minuteField.value ?? ""}
                    disabled={config.disabled}
                />


                <div className="flex border border-border rounded-md bg-background w-max">
                    <button
                        type="button"
                        onClick={() => ampmField.onChange("AM")}
                        className={`px-2 py-2 text-xs rounded-l-md rounded-r-none border border-primary/10 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${ampmField.value === "AM"
                            ? "text-white bg-primary"
                            : "bg-white hover:bg-muted/50 text-muted-foreground"
                            }`}
                        disabled={config.disabled}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={() => ampmField.onChange("PM")}
                        className={`px-2 py-2 text-xs font-semibold rounded-r-md rounded-l-none border border-primary/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${ampmField.value === "PM"
                            ? "text-white bg-primary"
                            : "bg-white hover:bg-muted/50 text-muted-foreground"
                            } ${ampmError ? "border-red-500" : ""}`}
                        disabled={config.disabled}
                    >
                        PM
                    </button>
                </div>

            </div>

            {/* {(hourError || minuteError || ampmError) && (
                <p className="text-xs text-red-500">
                    {hourError?.message || minuteError?.message || ampmError?.message}
                </p>
            )} */}
        </div>
    )
})

export default FormTime