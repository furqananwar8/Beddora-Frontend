"use client"

import { Controller, useFormContext } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FormCheckboxTypes } from "./fields.types"
import { memo } from "react"
import { useFieldController } from "./useFieldController"

const FormCheckbox = memo(({ field: config }: { field: FormCheckboxTypes }) => {

    const { field, error } = useFieldController(config.name)

    return (
        <div className={`flex items-center gap-2 ${config.wrapperClassName || ""}`}>
            {/* icon position left */}
            {config.iconPosition === "left" && config.icon}
            <Checkbox
                disabled={config.disabled}
                id={field.name + config.addressType}
                checked={field.value || false}
                onCheckedChange={(checked) => field.onChange(checked)}
                className={`${field.value ? config.selectedClassName : ""} ${error ? "border-red-500 bg-red-50 placeholder:text-red-500" : ""} border-primary/10 border cursor-pointer`}
            />
            {config.label && (
                <Label htmlFor={field.name + config.addressType} className={`cursor-pointer ${error ? "text-red-500" : ""} ${config.labelClassName || ""}`}>
                    {config.label}
                </Label>
            )}
            {config.iconPosition === "right" && config.icon}
        </div>
    )
})
export default FormCheckbox