"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { memo } from "react"
import { FormRadioTypes } from "./fields.types"
import { useFieldController } from "./useFieldController"

const FormRadio = memo(({ field: config }: { field: FormRadioTypes }) => {
    const { field, error } = useFieldController(config.name)
    return (
        <div className={config.wrapperClassName}>
            {config.label &&
                <Label>
                    {config.label}
                </Label>}
            <RadioGroup
                value={field.value?.toString() ?? ""}
                onValueChange={(value) => {
                    let parsed: any = value

                    if (config.valueType === "boolean") {
                        parsed = value === "true"
                    } else if (config.valueType === "number") {
                        parsed = Number(value)
                    }

                    field.onChange(parsed)
                }}
                defaultValue={config.defaultValue?.toString()}
                // convert string to boolean
                // onChange={() => field.onChange}
                className={`flex gap-6 ${config.className} cursor-pointer mb-2 `}
            >
                {config.options.map((opt) => {
                    const isSelected = field.value?.toString() === opt.value.toString()
                    return (
                        <div key={opt.value} className="flex items-center gap-2 ">
                            <RadioGroupItem
                                disabled={config.disabled}
                                value={opt.value.toString()}
                                id={`${config.name}-${opt.value}`}
                                className={`${error ? "border-red-500" : ""} ${isSelected ? config.selectedClassName : ""} cursor-pointer border border-primary/50`}
                            />
                            <Label htmlFor={`${config.name}-${opt.value}`} className={`cursor-pointer ${error ? "text-red-500" : ""}`}>
                                {opt.label}
                            </Label>
                        </div>
                    )
                })}
            </RadioGroup>
            {error && <p className="text-red-500 text-sm">{error.message}</p>}
        </div>
    )
})
export default FormRadio