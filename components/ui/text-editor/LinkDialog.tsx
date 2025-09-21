"use client";

import React, { useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useClickOutside } from "@/hooks/common/useClickOutside";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";

interface LinkDialogProps {
    isOpen: boolean;
    selectedText: string;
    linkText: string;
    linkUrl: string;
    onTextChange: (text: string) => void;
    onUrlChange: (url: string) => void;
    onInsert: () => void;
    onCancel: () => void;
}

const LinkDialog: React.FC<LinkDialogProps> = ({
    isOpen,
    selectedText,
    linkText,
    linkUrl,
    onTextChange,
    onUrlChange,
    onInsert,
    onCancel,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const t = useTranslations(
        "governance.createProposalModal.textEditor.linkDialog"
    );

    useClickOutside(dialogRef, onCancel);

    const setTextInputRef = useCallback(
        (element: HTMLInputElement | null) => {
            textInputRef.current = element;
            if (element && isOpen && !selectedText) {
                element.focus();
            }
        },
        [isOpen, selectedText]
    );

    const setUrlInputRef = useCallback(
        (element: HTMLInputElement | null) => {
            urlInputRef.current = element;
            if (element && isOpen && selectedText) {
                element.focus();
            }
        },
        [isOpen, selectedText]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "Escape") {
                onCancel();
            } else if (event.key === "Enter" && linkUrl.trim()) {
                event.preventDefault();
                onInsert();
            }
        },
        [linkUrl, onCancel, onInsert]
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                ref={dialogRef}
                onKeyDown={handleKeyDown}
                className="relative overflow-hidden w-full max-w-[400px] min-w-[320px] bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg flex flex-col p-4 gap-4 shadow-xl"
                tabIndex={-1}
            >
                <div className="flex flex-col">
                    <h2 className="text-primary text-xl font-medium leading-7 font-sans">
                        Insert Link
                    </h2>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-start gap-2">
                        <label className="text-secondary text-[14px] font-medium leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {selectedText
                                ? t("selectedTextLabel")
                                : t("linkTextLabel")}
                        </label>
                        {selectedText ? (
                            <div className="w-full p-[10px_16px] rounded-[8px] border border-[#1F1F1F] bg-[#141414] text-primary text-[14px] font-normal leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                                {selectedText}
                            </div>
                        ) : (
                            <input
                                ref={setTextInputRef}
                                type="text"
                                value={linkText}
                                onChange={(e) => onTextChange(e.target.value)}
                                placeholder={t("linkTextPlaceholder")}
                                className="w-full p-[10px_16px] rounded-[8px] border border-[#1F1F1F] bg-[#141414] text-primary text-[14px] font-normal leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] focus:outline-none focus:border-[#2F2F2F] focus:ring-0 placeholder:text-secondary"
                            />
                        )}
                    </div>

                    <div className="flex flex-col items-start gap-2">
                        <label className="text-secondary text-[14px] font-medium leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off]">
                            {t("urlLabel")}
                        </label>
                        <input
                            ref={setUrlInputRef}
                            type="url"
                            value={linkUrl}
                            onChange={(e) => onUrlChange(e.target.value)}
                            placeholder={t("linkUrlPlaceholder")}
                            className="w-full p-[10px_16px] rounded-[8px] border border-[#1F1F1F] bg-[#141414] text-primary text-[14px] font-normal leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] focus:outline-none focus:border-[#2F2F2F] focus:ring-0 placeholder:text-secondary"
                        />
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        className={[
                            "group relative",
                            "flex items-center justify-center gap-2",
                            "h-10 px-6 py-2.5",
                            "rounded-full",
                            "border border-[#292929]",
                            "bg-[#1B1B1B]",
                            "outline-none",
                            "cursor-pointer",
                            "overflow-hidden",
                            "transition-all duration-300 ease-out",
                            "hover:scale-[1.02] hover:border-[#3a3a3a] hover:bg-[#232323]",
                            "active:scale-[0.98]",
                            "focus-visible:ring-2 focus-visible:ring-[#292929]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414]",
                        ].join(" ")}
                        aria-label="Cancel"
                    >
                        <span className="text-center text-[14px] leading-5 font-medium [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] text-[#E6E6E6] transition-all duration-300 ease-out group-hover:tracking-wide">
                            {t("cancel")}
                        </span>
                    </button>
                    <PrimaryButton
                        label={t("insert")}
                        onClick={onInsert}
                        disabled={!linkUrl.trim()}
                    />
                </div>
            </div>
        </div>
    );
};

export default LinkDialog;
