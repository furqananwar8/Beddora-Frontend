import { useController, useFormContext } from "react-hook-form";
export function useFieldController(name: string) {
    const { control } = useFormContext();
    const { field, fieldState: { error } } = useController({
        name,
        control,
    })
    return { field, error }
}