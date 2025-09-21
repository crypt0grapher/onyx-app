"use client";

import React from "react";
import { toast, ToastContent, ToastOptions, Id } from "react-toastify";
import Toast, { ToastProps } from "@/components/ui/common/Toast";

export interface UseToastOptions {
    duration?: number;
    toastOptions?: Partial<ToastOptions>;
}

export interface ShowToastParams {
    variant: "success" | "danger";
    text: string;
    subtext?: string;
    options?: UseToastOptions;
}

const useToast = () => {
    const showToast = ({
        variant,
        text,
        subtext,
        options = {},
    }: ShowToastParams): Id => {
        const { duration = 4000, toastOptions = {} } = options;

        const toastContent: ToastContent = ({ closeToast }) => {
            return React.createElement(Toast, {
                variant,
                text,
                subtext,
                onClose: closeToast,
            });
        };

        const defaultOptions: ToastOptions = {
            position: "top-right",
            autoClose: duration,
            hideProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            closeButton: false,
            ...toastOptions,
        };

        return toast(toastContent, defaultOptions);
    };

    const showSuccessToast = (
        text: string,
        subtext?: string,
        options?: UseToastOptions
    ): Id => {
        return showToast({
            variant: "success",
            text,
            subtext,
            options,
        });
    };

    const showDangerToast = (
        text: string,
        subtext?: string,
        options?: UseToastOptions
    ): Id => {
        return showToast({
            variant: "danger",
            text,
            subtext,
            options,
        });
    };

    const dismissToast = (toastId?: Id) => {
        if (toastId) {
            toast.dismiss(toastId);
        } else {
            toast.dismiss();
        }
    };

    return {
        showToast,
        showSuccessToast,
        showDangerToast,
        dismissToast,
    };
};

export default useToast;
