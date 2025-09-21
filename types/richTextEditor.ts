import { StaticImageData } from "next/image";

export interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    minHeight?: number;
    maxHeight?: number;
}

export type AlignmentType = "left" | "center" | "right";
export type TitleLevel = "h1" | "h2" | "h3" | "h4" | "normal";

export interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    minHeight?: number;
    maxHeight?: number;
}

export interface ToolbarAction {
    id: string;
    label: string;
    icon: string | StaticImageData;
    action: () => void;
    isActive?: boolean;
    group: "text" | "alignment" | "title";
}

export interface LinkDialogState {
    isOpen: boolean;
    selectedText: string;
    url: string;
}

export interface TextSelection {
    start: number;
    end: number;
    text: string;
}

export interface EditorAction {
    type: "bold" | "italic" | "bulletList" | "alignment" | "title" | "link";
    value?: string;
}

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    action: () => void;
}
