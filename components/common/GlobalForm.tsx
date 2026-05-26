import { memo } from "react"
import FormField from "./form/FormField"
import FormSelect from "./form/FormSelect"
import FormCheckbox from "./form/FormCheckbox"
import FormRadio from "./form/FormRadio"
import FormDate from "./form/FormDate"
import FormTime from "./form/FormTime"

export const FieldRenderer = memo(({ field, type }: any) => {
  if (field.show === false) return null
  switch (field.type) {
    case "text":
    case "email":
    case "password":
    case "number":
    case "textarea":
      return <FormField field={field} />
    case "select":
      return <FormSelect field={field} />
    case "checkbox":
      return <FormCheckbox field={field} />
    case "radio":
      return <FormRadio field={field} />
    case "date":
      return <FormDate field={field} />
    case "time":
      return <FormTime field={field} />
    case "non-input":
      return (
        <div className={`${field.wrapperClassName} ${field.show ? "block" : "hidden"}`}>
          {field.children}
        </div>
      )
    default:
      return null
  }
})

export function GlobalForm({ fields, formWrapperClassName, extra }: { fields: any[], formWrapperClassName?: string, extra?: React.ReactNode }) {
  return (
    <div className={formWrapperClassName || ""}>
      {fields.map((field) => (
        <FieldRenderer key={field.name + field.label} field={field} />
      ))}
      {extra}
    </div>
  )
}