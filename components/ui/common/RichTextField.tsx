"use client";

import React from "react";
import RichTextEditor from "@/components/ui/text-editor/RichTextEditor";

interface RichTextFieldProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
    labelClassName?: string;
    disabled?: boolean;
    minHeight?: number;
    maxHeight?: number;
    editorClassName?: string;
}

const RichTextField: React.FC<RichTextFieldProps> = ({
    label,
    placeholder,
    value,
    onChange,
    className = "",
    labelClassName = "",
    disabled = false,
    minHeight = 212,
    maxHeight = 400,
    editorClassName = "",
}) => {
    const defaultLabelClassName =
        "text-secondary text-[14px] font-medium leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]";

    return (
        <div className={`flex flex-col items-start gap-2 w-full ${className}`}>
            {label && (
                <label className={`${defaultLabelClassName} ${labelClassName}`}>
                    {label}
                </label>
            )}

            <RichTextEditor
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full ${editorClassName}`}
                disabled={disabled}
                minHeight={minHeight}
                maxHeight={maxHeight}
            />
        </div>
    );
};

export default RichTextField;
