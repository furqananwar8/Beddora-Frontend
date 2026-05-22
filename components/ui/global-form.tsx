"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";

export type GlobalFormFieldConfig<Value, Values extends Record<string, any>> = {
  defaultValue: Value;
  placeholder?: string;
  validate?: (value: Value, values: Values) => string | null;
};

export type GlobalFormConfig<Values extends Record<string, any>> = {
  [Key in keyof Values]: GlobalFormFieldConfig<Values[Key], Values>;
};

export type GlobalFormControl<Values extends Record<string, any>> = {
  values: Values;
  errors: Partial<Record<keyof Values, string>>;
  setValue: <Key extends keyof Values>(name: Key, value: Values[Key]) => void;
  getValue: <Key extends keyof Values>(name: Key) => Values[Key];
  validateField: <Key extends keyof Values>(name: Key) => boolean;
  validateAll: () => boolean;
  reset: () => void;
};

export function useGlobalForm<Values extends Record<string, any>>(config: GlobalFormConfig<Values>) {
  const initialValues = useMemo(() => {
    return Object.keys(config).reduce((acc, key) => {
      acc[key as keyof Values] = config[key as keyof Values].defaultValue;
      return acc;
    }, {} as Values);
  }, [config]);

  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});

  const validateField = useCallback(
    (name: keyof Values) => {
      const validate = config[name]?.validate;
      const value = values[name];
      const error = validate ? validate(value, values) : null;
      setErrors((prev) => ({
        ...prev,
        [name]: error ?? undefined,
      }));
      return !error;
    },
    [config, values]
  );

  const validateAll = useCallback(() => {
    const fieldNames = Object.keys(config) as Array<keyof Values>;
    const isValid = fieldNames.reduce((valid, name) => {
      return validateField(name) && valid;
    }, true);
    return isValid;
  }, [config, validateField]);

  const setValue = useCallback(
    <Key extends keyof Values>(name: Key, value: Values[Key]) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (errors[name]) {
        validateField(name);
      }
    },
    [errors, validateField]
  );

  const getValue = useCallback(
    <Key extends keyof Values>(name: Key) => {
      return values[name];
    },
    [values]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const control: GlobalFormControl<Values> = {
    values,
    errors,
    setValue,
    getValue,
    validateField,
    validateAll,
    reset,
  };

  return {
    control,
    config,
    handleSubmit: (onSubmit: (values: Values) => void) => {
      return (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        if (validateAll()) {
          onSubmit(values);
        }
      };
    },
  };
}
