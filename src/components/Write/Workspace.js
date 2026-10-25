"use client";

import { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { countWords, kindOf, loadDraftContent, reportDraftError, requestReview, updateDraft } from "@/lib/drafts";
import { useAutosave } from "@/lib/useAutosave";
import { draftExtensions } from "./editorExtensions";
import { createReviewMarks, findingRanges, reviewMarksKey } from "./reviewMarks";
import Toolbar from "./Toolbar";
import FramingPanel from "./FramingPanel";
import ReviewPanel from "./ReviewPanel";
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

  // The review on screen (null while editing), the finding chosen in the
  // panel, and the check in progress.
  const [review, setReview] = useState(null);
  const [active, setActive] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);

  const ready = Boolean(loaded);
  const editor = useEditor(
    {
      extensions: draftExtensions,
      content: loaded?.content ?? null,
      editable: ready && !review && !checking,
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

  // Saves, then checks the saved draft. The sheet is locked from the moment
  // the check starts, so the review always matches what is on screen.
  async function handleCheck() {
    if (!editor || checking) return;
    setChecking(true);
    setCheckError(null);
    editor.setEditable(false, false);

    const saved = await autosave.flush();
    const { data, error } = saved
      ? await requestReview(draft.id)
      : { error: "Your latest changes are not saved yet, so the check did not run. Try again in a moment." };
    setChecking(false);
    if (editor.isDestroyed) return;

    if (error) {
      setCheckError(error);
      editor.setEditable(true, false);
      return;
    }

    onDraftChange(draft.id, {
      last_review: data.review,
      ...(data.last_reviewed_at ? { last_reviewed_at: data.last_reviewed_at } : {}),
    });
    if (data.updated_at) onSaved(draft.id, data.updated_at);

    const ranges = findingRanges(editor.state.doc, data.review.findings);
    editor.registerPlugin(
      createReviewMarks(ranges, { mark: styles.reviewMark, active: styles.reviewMarkActive, number: styles.reviewNumber })
    );
    setActive(null);
    setReview(data.review);
  }

  // From the panel's index: show that note and bring its passage into view.
  // From the sheet: the passage is already in view. Choosing the open note
  // again closes it.
  function handleSelectFinding(number, { fromSheet = false } = {}) {
    const next = number === active ? null : number;
    setActive(next);
    editor.view.dispatch(editor.state.tr.setMeta(reviewMarksKey, { active: next }));
    const mark = next && !fromSheet && editor.view.dom.querySelector(`[data-finding="${next}"]`);
    if (mark) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      mark.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    }
  }

  function handleSheetClick(event) {
    const target = event.target.closest?.("[data-finding], [data-finding-number]");
    if (!target) return;
    handleSelectFinding(Number(target.dataset.finding || target.dataset.findingNumber), { fromSheet: true });
  }

  function handleEdit() {
    editor.unregisterPlugin(reviewMarksKey);
    editor.setEditable(true, false);
    setReview(null);
    setActive(null);
    editor.commands.focus();
  }

  return (
    <>
      <Toolbar
        editor={ready ? editor : null}
        checkedAs={review ? kindOf(review.kind).label : null}
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
            <EditorContent
              editor={editor}
              className={`${styles.editor} ${review ? styles.reviewing : ""}`}
              onClick={review ? handleSheetClick : undefined}
            />
          ) : (
            <p className={styles.sheetNote}>Opening your draft</p>
          )}
        </main>
        {panelOpen && review ? (
          <ReviewPanel review={review} active={active} onSelect={handleSelectFinding} onEdit={handleEdit} />
        ) : panelOpen ? (
          <FramingPanel
            target={draft.target}
            kind={draft.kind}
            onKindChange={handleKindChange}
            onChangeTarget={() => {
              autosave.flush();
              onChangeTarget();
            }}
            onCheck={ready && !loadFailed ? handleCheck : null}
            checking={checking}
            checkError={checkError}
          />
        ) : null}
      </div>
    </>
  );
}
