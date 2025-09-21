import { useCallback } from "react";

export const useClipboard = () => {
    const copyToClipboard = useCallback(
        async (text: string): Promise<boolean> => {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                console.error("Failed to copy to clipboard:", error);

                try {
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-999999px";
                    textArea.style.top = "-999999px";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();

                    const successful = document.execCommand("copy");
                    document.body.removeChild(textArea);

                    return successful;
                } catch (fallbackError) {
                    console.error("Fallback copy failed:", fallbackError);
                    return false;
                }
            }
        },
        []
    );

    return { copyToClipboard };
};
