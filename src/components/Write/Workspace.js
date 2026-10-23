"use client";

import { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { countWords, loadDraftContent, reportDraftError, updateDraft } from "@/lib/drafts";
import { useAutosave } from "@/lib/useAutosave";
import { draftExtensions } from "./editorExtensions";
import Toolbar from "./Toolbar";
import FramingPanel from "./FramingPanel";
import styles from "./Write.module.css";

/*
 * One open draft: toolbar, rail, sheet and framing panel. Mounted per draft
 * (keyed by id), so the editor's undo history never reaches into another
 * draft. Content comes from `cache` when this session already has it, which
 * also covers a save still in flight from the last time it was open;
 * otherwise it is fetched.
 */
export default function Workspace({
  supabase,
  draft,
  cache,
  autofocus,
  rail,
  railOpen,
  panelOpen,
  onToggleRail,
  onTogglePanel,
  onDraftChange,
  onSaved,
  onChangeTarget,
}) {
  const cached = cache.has(draft.id);
  const [loaded, setLoaded] = useState(cached ? { content: cache.get(draft.id) } : null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [wordCount, setWordCount] = useState(draft.word_count);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    loadDraftContent(supabase, draft.id).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        reportDraftError(error, "load");
        setLoadFailed(true);
        return;
      }
      cache.set(draft.id, data.content);
      setLoaded({ content: data.content });
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, draft.id, cache, cached]);

  const save = useCallback(
    async (patch) => {
      const { data, error } = await updateDraft(supabase, draft.id, patch);
      if (error) reportDraftError(error, "save");
      else onSaved(draft.id, data.updated_at);
      return { error };
    },
    [supabase, draft.id, onSaved]
  );
  const autosave = useAutosave(save);

  const ready = Boolean(loaded);
  const editor = useEditor(
    {
      extensions: draftExtensions,
      content: loaded?.content ?? null,
      editable: ready,
      autofocus: ready && autofocus ? "end" : false,
      immediatelyRender: false,
      editorProps: {
        attributes: { class: styles.prose, "aria-label": "Draft", "aria-multiline": "true", role: "textbox" },
      },
      onUpdate: ({ editor: e }) => {
        const json = e.getJSON();
        const text = e.getText({ blockSeparator: "\n\n" });
        const words = countWords(text);
        cache.set(draft.id, json);
        setWordCount(words);
        onDraftChange(draft.id, { word_count: words });
        autosave.schedule({ content: json, content_text: text, word_count: words });
      },
      onBlur: () => {
        autosave.flush();
      },
    },
    // A fresh editor once the content arrives, so loading is not an undo step.
    [ready]
  );

  function handleTitleChange(value) {
    onDraftChange(draft.id, { title: value });
    autosave.schedule({ title: value.trim() || "Untitled" });
  }

  function handleKindChange(kind) {
    onDraftChange(draft.id, { kind });
    autosave.schedule({ kind });
    autosave.flush();
  }

  return (
    <>
      <Toolbar
        editor={ready ? editor : null}
        title={draft.title}
        onTitleChange={handleTitleChange}
        onTitleBlur={() => autosave.flush()}
        saveStatus={autosave.status}
        wordCount={wordCount}
        railOpen={railOpen}
        onToggleRail={onToggleRail}
        panelOpen={panelOpen}
        onTogglePanel={onTogglePanel}
      />
      <div className={`${styles.workspace} ${railOpen ? "" : styles.noRail} ${panelOpen ? "" : styles.noPanel}`}>
        {railOpen ? rail : null}
        <main className={styles.sheet}>
          {loadFailed ? (
            <p className={styles.sheetNote} role="alert">
              This draft could not be opened. Refresh the page to try again.
            </p>
          ) : ready ? (
            <EditorContent editor={editor} className={styles.editor} />
          ) : (
            <p className={styles.sheetNote}>Opening your draft</p>
          )}
        </main>
        {panelOpen ? (
          <FramingPanel
            target={draft.target}
            kind={draft.kind}
            onKindChange={handleKindChange}
            onChangeTarget={() => {
              autosave.flush();
              onChangeTarget();
            }}
          />
        ) : null}
      </div>
    </>
  );
}
