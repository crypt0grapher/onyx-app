"use client";

import React, { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import FormatIcon from "@/components/ui/text-editor/FormatIcon";
import Dropdown, { type DropdownOption } from "@/components/ui/common/Dropdown";
import Divider from "@/components/ui/common/Divider";
import { AlignmentType } from "@/types/richTextEditor";

import bulletListIcon from "@/assets/icons/bullet_list.svg";
import chainIcon from "@/assets/icons/chain.svg";
import boldIcon from "@/assets/icons/bold.svg";
import italicIcon from "@/assets/icons/italic.svg";
import alignmentLeftIcon from "@/assets/icons/alignment_left.svg";
import alignmentCenterIcon from "@/assets/icons/alignment_center.svg";
import alignmentRightIcon from "@/assets/icons/alignment_right.svg";

interface EditorToolbarProps {
  editor: Editor;
  selectedTitle?: string;
  disabled?: boolean;
  onTitleChange: (titleId: string) => void;
  onInsertLink: () => void;
}

const titleOptions: DropdownOption[] = [
  { id: "normal", label: "Normal" },
  { id: "h1", label: "Title 1" },
  { id: "h2", label: "Title 2" },
  { id: "h3", label: "Title 3" },
  { id: "h4", label: "Title 4" },
];

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  selectedTitle,
  disabled = false,
  onTitleChange,
  onInsertLink,
}) => {
  const onToggleBold = () => editor.chain().focus().toggleBold().run();
  const onToggleItalic = () => editor.chain().focus().toggleItalic().run();
  const onToggleBulletList = () =>
    editor.chain().focus().toggleBulletList().run();
  const onSetAlignment = (alignment: AlignmentType) =>
    editor.chain().focus().setTextAlign(alignment).run();

  const [activeState, setActiveState] = useState({
    bold: false,
    italic: false,
    bulletList: false,
    alignment: "left" as AlignmentType,
    selectedTitle: selectedTitle || "normal",
  });

  useEffect(() => {
    if (!editor) return;

    const updateActiveState = () => {
      const bold = editor.isActive("bold");
      const italic = editor.isActive("italic");
      const bulletList = editor.isActive("bulletList");

      const pAttrs = editor.getAttributes("paragraph") || {};
      const hAttrs = editor.getAttributes("heading") || {};
      const alignment = (pAttrs.textAlign ||
        hAttrs.textAlign ||
        "left") as AlignmentType;

      let selectedTitleLocal = "normal";
      if (editor.isActive("heading", { level: 1 })) selectedTitleLocal = "h1";
      else if (editor.isActive("heading", { level: 2 }))
        selectedTitleLocal = "h2";
      else if (editor.isActive("heading", { level: 3 }))
        selectedTitleLocal = "h3";
      else if (editor.isActive("heading", { level: 4 }))
        selectedTitleLocal = "h4";

      setActiveState({
        bold,
        italic,
        bulletList,
        alignment,
        selectedTitle: selectedTitleLocal,
      });
    };

    updateActiveState();

    const handleSelection = () => updateActiveState();
    const handleUpdate = () => updateActiveState();

    editor.on("selectionUpdate", handleSelection);
    editor.on("update", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleSelection);
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  return (
    <div className="border-b border-[#1F1F1F] bg-[#141414] rounded-t-[8px]">
      <div className="hidden sm:flex h-10 pr-4 justify-between items-center">
        <div className="flex-1 max-w-[120px]">
          <Dropdown
            options={titleOptions}
            selectedId={activeState.selectedTitle}
            onSelect={(id) => {
              onTitleChange(id);
              setActiveState((s) => ({
                ...s,
                selectedTitle: id,
              }));
            }}
            backgroundColor="bg-transparent"
            borderColor="border-none border-transparent"
            dropdownBackgroundColor="bg-[#141414]"
            dropdownBorderColor="border-[#1F1F1F]"
            className="text-[14px]"
            disabled={disabled}
          />
        </div>

        <div className="flex items-center gap-4 h-full">
          <Divider
            orientation="vertical"
            className="shrink-0 bg-[#1F1F1F] sm:min-h-full h-6"
          />

          <div className="flex items-center gap-3">
            <FormatIcon
              src={bulletListIcon}
              alt="Toggle Bullet List"
              onClick={onToggleBulletList}
              isActive={activeState.bulletList}
              tooltip="Toggle Bullet List (Ctrl+Shift+8)"
              disabled={disabled}
            />
            <FormatIcon
              src={chainIcon}
              alt="Insert Link"
              onClick={onInsertLink}
              isActive={editor.isActive("link")}
              tooltip="Insert Link (Ctrl+K)"
              disabled={disabled}
            />
            <FormatIcon
              src={boldIcon}
              alt="Toggle Bold"
              onClick={onToggleBold}
              isActive={activeState.bold}
              tooltip="Toggle Bold (Ctrl+B)"
              disabled={disabled}
            />
            <FormatIcon
              src={italicIcon}
              alt="Toggle Italic"
              onClick={onToggleItalic}
              isActive={activeState.italic}
              tooltip="Toggle Italic (Ctrl+I)"
              disabled={disabled}
            />
          </div>

          <Divider
            orientation="vertical"
            className="shrink-0 bg-[#1F1F1F] sm:min-h-full h-6"
          />

          <div className="flex items-center gap-4">
            <FormatIcon
              src={alignmentLeftIcon}
              alt="Align Left"
              onClick={() => onSetAlignment("left")}
              isActive={activeState.alignment === "left"}
              disabled={disabled}
            />
            <FormatIcon
              src={alignmentCenterIcon}
              alt="Align Center"
              onClick={() => onSetAlignment("center")}
              isActive={activeState.alignment === "center"}
              disabled={disabled}
            />
            <FormatIcon
              src={alignmentRightIcon}
              alt="Align Right"
              onClick={() => onSetAlignment("right")}
              isActive={activeState.alignment === "right"}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="sm:hidden">
        <div className="flex h-10 items-center border-b border-[#1F1F1F]">
          <Dropdown
            options={titleOptions}
            selectedId={activeState.selectedTitle}
            onSelect={(id) => {
              onTitleChange(id);
              setActiveState((s) => ({
                ...s,
                selectedTitle: id,
              }));
            }}
            backgroundColor="bg-transparent"
            borderColor="border-none border-transparent"
            dropdownBackgroundColor="bg-[#141414]"
            dropdownBorderColor="border-[#1F1F1F]"
            className="text-[14px]"
            disabled={disabled}
          />
        </div>

        <div className="flex h-10 px-4 items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <FormatIcon
              src={bulletListIcon}
              alt="Toggle Bullet List"
              onClick={onToggleBulletList}
              isActive={editor.isActive("bulletList")}
              disabled={disabled}
            />
            <FormatIcon
              src={chainIcon}
              alt="Insert Link"
              onClick={onInsertLink}
              isActive={editor.isActive("link")}
              disabled={disabled}
            />
            <FormatIcon
              src={boldIcon}
              alt="Toggle Bold"
              onClick={onToggleBold}
              isActive={editor.isActive("bold")}
              disabled={disabled}
            />
            <FormatIcon
              src={italicIcon}
              alt="Toggle Italic"
              onClick={onToggleItalic}
              isActive={editor.isActive("italic")}
              disabled={disabled}
            />
          </div>

          <Divider
            orientation="vertical"
            className="shrink-0 bg-[#1F1F1F] sm:min-h-full h-6"
          />

          <div className="flex items-center gap-3">
            <FormatIcon
              src={alignmentLeftIcon}
              alt="Align Left"
              onClick={() => onSetAlignment("left")}
              isActive={activeState.alignment === "left"}
              disabled={disabled}
            />
            <FormatIcon
              src={alignmentCenterIcon}
              alt="Align Center"
              onClick={() => onSetAlignment("center")}
              isActive={activeState.alignment === "center"}
              disabled={disabled}
            />
            <FormatIcon
              src={alignmentRightIcon}
              alt="Align Right"
              onClick={() => onSetAlignment("right")}
              isActive={activeState.alignment === "right"}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
