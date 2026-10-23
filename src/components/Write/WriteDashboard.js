"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { createDraft, reportDraftError, updateDraft } from "@/lib/drafts";
import DraftsRail from "./DraftsRail";
import DraftSetup from "./DraftSetup";
import Workspace from "./Workspace";
import styles from "./Write.module.css";

function byNewest(a, b) {
  return new Date(b.updated_at) - new Date(a.updated_at);
}

/*
 * The writing dashboard. The server hands over the draft list (no content);
 * the open draft's content loads in its Workspace. A first visit with no
 * drafts opens the setup card. The setup card replaces the workspace on the
 * dashboard rather than covering it, and the open draft stays mounted (just
 * hidden) underneath, so nothing it has not saved yet is lost or reloaded.
 */
export default function WriteDashboard({ initialDrafts, loadError = false }) {
  const supabase = useMemo(() => createClient(), []);
  const { user, loading } = useAuth();
  const [drafts, setDrafts] = useState(() => [...initialDrafts].sort(byNewest));
  const [currentId, setCurrentId] = useState(initialDrafts.length ? [...initialDrafts].sort(byNewest)[0].id : null);
  const [setup, setSetup] = useState(!loadError && initialDrafts.length === 0 ? "new" : null);
  const [justCreated, setJustCreated] = useState(null);
  const [railOpen, setRailOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  // Latest content per draft this session, so reopening a draft never reads
  // an older copy than the one just typed.
  const [cache] = useState(() => new Map());

  // Signing out from the avatar menu leaves the dashboard.
  useEffect(() => {
    if (!loading && !user) window.location.assign("/");
  }, [loading, user]);

  const current = drafts.find((draft) => draft.id === currentId) || null;

  const handleDraftChange = useCallback((id, patch) => {
    setDrafts((list) => list.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }, []);

  const handleSaved = useCallback((id, updatedAt) => {
    setDrafts((list) => list.map((draft) => (draft.id === id ? { ...draft, updated_at: updatedAt } : draft)).sort(byNewest));
  }, []);

  async function handleSetupSubmit(values) {
    if (setup === "new") {
      const { data, error } = await createDraft(supabase, values);
      if (error) {
        reportDraftError(error, "create");
        return { error };
      }
      cache.set(data.id, null);
      setDrafts((list) => [data, ...list]);
      setCurrentId(data.id);
      setJustCreated(data.id);
      setSetup(null);
      return {};
    }

    const patch = {
      title: values.title.trim() || "Untitled",
      kind: values.kind,
      target: values.target.trim() || null,
      topic: values.topic.trim() || null,
    };
    const { data, error } = await updateDraft(supabase, current.id, patch);
    if (error) {
      reportDraftError(error, "edit");
      return { error };
    }
    handleDraftChange(current.id, patch);
    handleSaved(current.id, data.updated_at);
    setSetup(null);
    return {};
  }

  const rail = (
    <DraftsRail
      drafts={drafts}
      currentId={currentId}
      error={loadError}
      onSelect={(id) => {
        setCurrentId(id);
        setJustCreated(null);
      }}
      onNew={() => setSetup("new")}
    />
  );

  return (
    <div className={styles.dashboard}>
      {setup ? (
        <DraftSetup
          key={setup === "new" ? "new" : `edit-${current?.id}`}
          mode={setup}
          initial={setup === "edit" ? current : null}
          onSubmit={handleSetupSubmit}
          onCancel={drafts.length ? () => setSetup(null) : undefined}
        />
      ) : null}

      <div className={styles.dashboardBody} hidden={Boolean(setup)}>
        {current ? (
          <Workspace
            key={current.id}
            supabase={supabase}
            draft={current}
            cache={cache}
            autofocus={current.id === justCreated}
            rail={rail}
            railOpen={railOpen}
            panelOpen={panelOpen}
            onToggleRail={() => setRailOpen((open) => !open)}
            onTogglePanel={() => setPanelOpen((open) => !open)}
            onDraftChange={handleDraftChange}
            onSaved={handleSaved}
            onChangeTarget={() => setSetup("edit")}
          />
        ) : (
          <div className={`${styles.workspace} ${styles.noPanel}`}>
            {rail}
            <main className={styles.sheet}>
              <p className={styles.sheetNote}>
                {loadError ? "Your drafts could not be loaded. Refresh the page to try again." : "Start a new draft to begin."}
              </p>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
