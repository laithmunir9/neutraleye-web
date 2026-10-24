"use client";

import { useState } from "react";
import { TARGET_SUGGESTIONS } from "@/lib/drafts";
import KindPicker from "./KindPicker";
import styles from "./Write.module.css";

/*
 * What a draft is: its title, its kind, who it is written toward and its
 * topic. Shown as a card on the dashboard itself, for a new draft and again
 * from "Change" for the open one, where the draft can also be deleted, after
 * a confirmation. `onCancel` is absent on a first visit, when there is
 * nothing to go back to.
 */
export default function DraftSetup({ mode, initial, onSubmit, onCancel, onDelete }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "essay");
  const [target, setTarget] = useState(initial?.target ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await onSubmit({ title, kind, target, topic });
    if (err) {
      setError("That did not save. Check your connection and try again.");
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError("");
    const { error: err } = await onDelete();
    if (err) {
      setError("That did not delete. Check your connection and try again.");
      setBusy(false);
      setConfirming(false);
    }
  }

  const isNew = mode === "new";

  return (
    <div className={styles.setupStage}>
      <form className={styles.setup} onSubmit={handleSubmit}>
        <h1 className={styles.setupHeading}>What are you setting out to write?</h1>

        <div className={styles.field}>
          <label htmlFor="setup-title" className={styles.fieldLabel}>
            Title
          </label>
          <input
            id="setup-title"
            className={styles.input}
            value={title}
            placeholder="You can change it later"
            autoComplete="off"
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <p id="setup-kind-label" className={styles.fieldLabel}>
            What kind of piece
          </p>
          <KindPicker value={kind} onChange={setKind} labelledBy="setup-kind-label" />
        </div>

        <div className={styles.field}>
          <label htmlFor="setup-target" className={styles.fieldLabel}>
            Who do you want to write like?
          </label>
          <p id="setup-target-hint" className={styles.fieldHint}>
            A publication, a section, or a kind of writer. Optional.
          </p>
          <input
            id="setup-target"
            className={styles.input}
            value={target}
            autoComplete="off"
            aria-describedby="setup-target-hint"
            onChange={(event) => setTarget(event.target.value)}
          />
          <div className={styles.chips} role="group" aria-label="Suggestions">
            {TARGET_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={styles.chip}
                aria-pressed={target === suggestion}
                onClick={() => setTarget(target === suggestion ? "" : suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="setup-topic" className={styles.fieldLabel}>
            Topic
          </label>
          <input
            id="setup-topic"
            className={styles.input}
            value={topic}
            placeholder="Optional. For example, the city's plan to cut library hours"
            autoComplete="off"
            onChange={(event) => setTopic(event.target.value)}
          />
        </div>

        {error ? (
          <p className={styles.setupError} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.setupFoot}>
          <p className={styles.setupNote}>
            NeutralEye will hold your draft to this when you check it. It will not write in this voice for you.
          </p>
          <div className={styles.setupActions}>
            {onCancel ? (
              <button type="button" className={styles.cancel} onClick={onCancel}>
                Cancel
              </button>
            ) : null}
            <button type="submit" className={styles.start} disabled={busy}>
              {busy ? "Saving" : isNew ? "Start writing" : "Save changes"}
            </button>
          </div>
        </div>

        {onDelete ? (
          <div className={styles.setupDelete}>
            {confirming ? (
              <>
                <p className={styles.deleteQuestion} role="alert">
                  Delete this draft for good? This cannot be undone.
                </p>
                <div className={styles.setupActions}>
                  <button type="button" className={styles.cancel} onClick={() => setConfirming(false)} disabled={busy}>
                    Keep it
                  </button>
                  <button type="button" className={styles.deleteConfirm} onClick={handleDelete} disabled={busy}>
                    {busy ? "Deleting" : "Delete draft"}
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className={styles.deleteLink} onClick={() => setConfirming(true)} disabled={busy}>
                Delete this draft
              </button>
            )}
          </div>
        ) : null}
      </form>
    </div>
  );
}
