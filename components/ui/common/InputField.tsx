"use client";

import React from "react";

interface InputFieldProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    type?: "text" | "email" | "password" | "number";
    className?: string;
    inputClassName?: string;
    labelClassName?: string;
    disabled?: boolean;
    required?: boolean;
    ariaLabel?: string;
    maxLength?: number;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    placeholder,
    value,
    onChange,
    type = "text",
    className = "",
    inputClassName = "",
    labelClassName = "",
    disabled = false,
    required = false,
    ariaLabel,
    maxLength,
}) => {
    const defaultLabelClassName =
        "text-secondary text-[14px] font-medium leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]";
    const defaultInputClassName =
        "flex p-[10px_16px] flex-col items-start gap-2 w-full rounded-[1000px] border border-[#1F1F1F] bg-[#141414] text-[14px] font-normal leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] focus:outline-none focus:border-[#2F2F2F] focus:ring-0 placeholder:text-secondary class:text-secondary:empty class:text-primary:!empty";

    return (
        <div className={`flex flex-col items-start gap-2 w-full ${className}`}>
            {label && (
                <label className={`${defaultLabelClassName} ${labelClassName}`}>
                    {label}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                maxLength={maxLength}
                aria-label={ariaLabel || label}
                className={`${defaultInputClassName} ${inputClassName} ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
            />
        </div>
    );
};

export default InputField;
