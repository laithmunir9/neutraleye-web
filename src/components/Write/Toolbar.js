"use client";

import { useEditorState } from "@tiptap/react";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  DraftsIcon,
  ItalicIcon,
  PanelIcon,
  RedoIcon,
  UnderlineIcon,
  UndoIcon,
} from "./icons";
import styles from "./Write.module.css";

const SAVE_LABELS = { saving: "Saving", saved: "Saved", error: "Not saved" };

const EMPTY_STATE = {
  bold: false,
  italic: false,
  underline: false,
  align: "left",
  canUndo: false,
  canRedo: false,
};

function ToolButton({ label, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      className={styles.tool}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      // Keep the selection in the editor when a formatting button is clicked.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/*
 * The row under the top bar: drafts toggle, the draft's title, undo and redo,
 * bold, italic and underline, the three alignments, then the save status,
 * the word count and the framing panel toggle.
 */
export default function Toolbar({
  editor,
  title,
  onTitleChange,
  onTitleBlur,
  saveStatus,
  wordCount,
  railOpen,
  onToggleRail,
  panelOpen,
  onTogglePanel,
}) {
  const state =
    useEditorState({
      editor,
      selector: ({ editor: e }) =>
        e
          ? {
              bold: e.isActive("bold"),
              italic: e.isActive("italic"),
              underline: e.isActive("underline"),
              align: ["center", "right"].find((a) => e.isActive({ textAlign: a })) || "left",
              canUndo: e.can().undo(),
              canRedo: e.can().redo(),
            }
          : EMPTY_STATE,
    }) || EMPTY_STATE;

  const off = !editor;
  const run = (fn) => () => fn(editor.chain().focus()).run();

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Draft">
      <div className={styles.toolGroup}>
        <ToolButton label={railOpen ? "Hide drafts" : "Show drafts"} active={railOpen} onClick={onToggleRail}>
          <DraftsIcon />
        </ToolButton>
        <label htmlFor="draft-title" className={styles.srOnly}>
          Draft title
        </label>
        <input
          id="draft-title"
          className={styles.titleInput}
          value={title}
          placeholder="Untitled"
          autoComplete="off"
          onChange={(event) => onTitleChange(event.target.value)}
          onBlur={onTitleBlur}
        />
        <span className={styles.toolRule} aria-hidden="true" />
        <ToolButton label="Undo" disabled={off || !state.canUndo} onClick={run((c) => c.undo())}>
          <UndoIcon />
        </ToolButton>
        <ToolButton label="Redo" disabled={off || !state.canRedo} onClick={run((c) => c.redo())}>
          <RedoIcon />
        </ToolButton>
        <span className={styles.toolRule} aria-hidden="true" />
        <ToolButton label="Bold" active={state.bold} disabled={off} onClick={run((c) => c.toggleBold())}>
          <BoldIcon />
        </ToolButton>
        <ToolButton label="Italic" active={state.italic} disabled={off} onClick={run((c) => c.toggleItalic())}>
          <ItalicIcon />
        </ToolButton>
        <ToolButton label="Underline" active={state.underline} disabled={off} onClick={run((c) => c.toggleUnderline())}>
          <UnderlineIcon />
        </ToolButton>
        <span className={styles.toolRule} aria-hidden="true" />
        <ToolButton label="Align left" active={state.align === "left"} disabled={off} onClick={run((c) => c.setTextAlign("left"))}>
          <AlignLeftIcon />
        </ToolButton>
        <ToolButton label="Align center" active={state.align === "center"} disabled={off} onClick={run((c) => c.setTextAlign("center"))}>
          <AlignCenterIcon />
        </ToolButton>
        <ToolButton label="Align right" active={state.align === "right"} disabled={off} onClick={run((c) => c.setTextAlign("right"))}>
          <AlignRightIcon />
        </ToolButton>
      </div>

      <div className={styles.toolMeta}>
        <span className={saveStatus === "error" ? styles.metaError : styles.meta} role="status">
          {SAVE_LABELS[saveStatus]}
        </span>
        <span className={styles.meta}>
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
        <ToolButton label={panelOpen ? "Hide framing panel" : "Show framing panel"} active={panelOpen} onClick={onTogglePanel}>
          <PanelIcon />
        </ToolButton>
      </div>
    </div>
  );
}
