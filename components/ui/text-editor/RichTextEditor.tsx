"use client";

import "./editor.css";
import React, { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { RichTextEditorProps } from "@/types/richTextEditor";
import EditorToolbar from "./EditorToolbar";
import LinkDialog from "./LinkDialog";

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Enter your text...",
    className = "",
    disabled = false,
    minHeight = 212,
    maxHeight = 400,
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4],
                },
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: "is-editor-empty",
                emptyNodeClass: "is-empty",
                showOnlyWhenEditable: true,
                showOnlyCurrent: true,
            }),
        ],
        immediatelyRender: false,
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "flex-1 p-4 bg-transparent border-none text-primary text-[14px] font-normal leading-5 font-sans [font-feature-settings:'ss11'_on,'cv09'_on,'liga'_off,'calt'_off] focus:outline-none resize-none custom-scrollbar",
            },
        },
        editable: !disabled,
    });

    const [isLinkDialogOpen, setLinkDialogOpen] = React.useState(false);
    const [linkUrl, setLinkUrl] = React.useState("");
    const [linkText, setLinkText] = React.useState("");

    const openLinkDialog = useCallback(() => {
        const previousUrl = editor?.getAttributes("link").href;
        if (previousUrl) {
            setLinkUrl(previousUrl);
        } else {
            setLinkUrl("");
        }

        if (editor?.state.selection.empty) {
            setLinkText("");
        } else {
            setLinkText(
                editor?.state.doc.textBetween(
                    editor.state.selection.from,
                    editor.state.selection.to,
                    " "
                ) || ""
            );
        }

        setLinkDialogOpen(true);
    }, [editor]);

    const closeLinkDialog = useCallback(() => {
        setLinkUrl("");
        setLinkText("");
        setLinkDialogOpen(false);
    }, []);

    const handleLinkInsert = useCallback(() => {
        if (linkUrl.trim() === "") {
            editor?.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        if (editor?.state.selection.empty) {
            const textToInsert = linkText || "Link Text";
            const insertPosition = editor.state.selection.from;
            editor
                ?.chain()
                .focus()
                .insertContent(textToInsert)
                .setTextSelection({
                    from: insertPosition,
                    to: insertPosition + textToInsert.length,
                })
                .setLink({ href: linkUrl })
                .run();
        } else {
            editor
                ?.chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: linkUrl })
                .run();
        }

        closeLinkDialog();
    }, [editor, linkUrl, linkText, closeLinkDialog]);

    if (!editor) {
        return null;
    }

    const handleTitleChange = (titleId: string) => {
        if (titleId === "normal") {
            editor.chain().focus().setNode("paragraph").run();
        } else {
            const level = parseInt(titleId.replace("h", ""), 10) as
                | 1
                | 2
                | 3
                | 4;
            editor.chain().focus().toggleHeading({ level }).run();
        }
    };

    const getSelectedTitle = () => {
        if (editor.isActive("heading", { level: 1 })) return "h1";
        if (editor.isActive("heading", { level: 2 })) return "h2";
        if (editor.isActive("heading", { level: 3 })) return "h3";
        if (editor.isActive("heading", { level: 4 })) return "h4";
        return "normal";
    };

    return (
        <div className={`relative ${className}`}>
            <div className="border border-[#1F1F1F] bg-[#141414] rounded-[8px] w-full flex flex-col">
                <EditorToolbar
                    editor={editor}
                    disabled={disabled}
                    onTitleChange={handleTitleChange}
                    selectedTitle={getSelectedTitle()}
                    onInsertLink={openLinkDialog}
                />
                <EditorContent
                    editor={editor}
                    style={
                        {
                            "--min-height": `${minHeight - 40}px`,
                            "--max-height": `${maxHeight - 40}px`,
                            "--min-height-mobile": `${minHeight - 80}px`,
                            "--max-height-mobile": `${maxHeight - 80}px`,
                        } as React.CSSProperties
                    }
                />
            </div>

            <LinkDialog
                isOpen={isLinkDialogOpen}
                selectedText={
                    editor.state.selection.empty
                        ? ""
                        : editor.state.doc.textBetween(
                              editor.state.selection.from,
                              editor.state.selection.to,
                              " "
                          )
                }
                linkText={linkText}
                linkUrl={linkUrl}
                onTextChange={setLinkText}
                onUrlChange={setLinkUrl}
                onInsert={handleLinkInsert}
                onCancel={closeLinkDialog}
            />
        </div>
    );
};

export default RichTextEditor;
