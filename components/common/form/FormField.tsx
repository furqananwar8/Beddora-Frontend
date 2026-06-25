"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, FileQuestionMark, Info } from "lucide-react";
import { memo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useFieldController } from "./useFieldController";
import { FormFieldTypes } from "./fields.types";

const FormField = memo(({ field: config }: { field: FormFieldTypes }) => {
  if (!config) return null; // safely skip undefined

  const { field, error } = useFieldController(config.name);
  const isPassword = config.type === "password";
  const [showPassword, setShowPassword] = useState(false);
  // if input type is number and min is 0, don't allow negative values
  // function to convert negatives to positives
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // allow empty input (important for UX)
    if (rawValue === "") {
      field.onChange("");
      return;
    }

    const value = Number(rawValue);

    if (value < 0) {
      field.onChange();
    } else {
      field.onChange(value);
    }
  };
  return (
    <div className={config.wrapperClassName || "w-full"}>
      <div className={`flex flex-col gap-2 ${config.className}`}>
        <div className="flex gap-2">
          <Label
            htmlFor={config.name}
            className={`${error ? "text-red-500" : ""} ${config.labelClassName}`}
          >
            {config.label}
          </Label>
        </div>
        {config.type !== "textarea" ? (
          <div className="relative">
            <Input
              id={config.name}
              type={
                isPassword
                  ? showPassword
                    ? "text"
                    : "password"
                  : config.type || "text"
              }
              placeholder={config.placeholder}
              {...field}
              className={`${config.inputClassName} ${error ? "border-red-500 bg-red-50 placeholder:text-red-500 focus:outline-red-100" : ""} ${isPassword ? "pr-10" : ""} border-primary/10 border`}
              disabled={config.disabled}
              onChange={(e) => {
                let value;

                if (config.type === "number") {
                  value =
                    e.target.value === "" ? undefined : Number(e.target.value);
                  handleNumberChange(e);
                } else {
                  if (config.name === "address.postalCode") {
                    const value = e.target.value.replace(/\s+/g, "");
                    field.onChange(value);
                  }
                  else{
                      value = e.target.value;
                      field.onChange(value);
                  }
                }
              }}
              value={field.value ?? ""}
              min={config.min}
              max={config.max}
            />

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
        ) : (
          <Textarea
            id={config.name}
            placeholder={config.placeholder}
            {...field}
            value={field.value ?? ""}
            className={`${config.className} ${error ? "border-red-500 bg-red-50 placeholder:text-red-500" : ""} border border-primary/10`}
          />
        )}

        {error && <p className="text-xs text-red-500">{error.message}</p>}
      </div>
    </div>
  );
});
export default FormField;
