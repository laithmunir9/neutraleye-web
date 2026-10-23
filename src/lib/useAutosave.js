"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const AUTOSAVE_DELAY_MS = 1500;

/*
 * Debounced saving for one draft. `schedule(patch)` merges the patch into
 * what is waiting and saves AUTOSAVE_DELAY_MS after the last change; `flush()`
 * saves now (on blur, before unload, when switching drafts). Saves never
 * overlap: changes made while one is in flight go out right after it.
 *
 * `save(patch)` returns { error }. Status is "saved", "saving" or "error".
 * While anything is unsaved the page asks before closing, and saves on the
 * way out.
 */
export function useAutosave(save, delay = AUTOSAVE_DELAY_MS) {
  const [status, setStatus] = useState("saved");
  const pending = useRef(null);
  const inFlight = useRef(null);
  const timer = useRef(null);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  });

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    timer.current = null;
    // Loops rather than recursing: changes typed during a save go out right
    // after it, unless a debounce is already waiting on them.
    for (;;) {
      if (inFlight.current) await inFlight.current;
      if (!pending.current) return;

      const patch = pending.current;
      pending.current = null;
      setStatus("saving");
      inFlight.current = Promise.resolve(saveRef.current(patch))
        .catch((error) => ({ error }))
        .then(({ error } = {}) => {
          inFlight.current = null;
          if (error) {
            // Put it back underneath anything newer, so the next change, blur
            // or flush retries it. Not retried here, or a lasting failure loops.
            pending.current = { ...patch, ...pending.current };
            setStatus("error");
            return false;
          }
          setStatus(pending.current ? "saving" : "saved");
          return true;
        });
      const saved = await inFlight.current;
      if (!saved || timer.current) return;
    }
  }, []);

  const schedule = useCallback(
    (patch) => {
      pending.current = { ...pending.current, ...patch };
      setStatus("saving");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, delay);
    },
    [delay, flush]
  );

  useEffect(() => {
    function onBeforeUnload(event) {
      if (!pending.current && !inFlight.current) return;
      flush();
      event.preventDefault();
      event.returnValue = "";
    }
    function onHidden() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onHidden);
      // Leaving this draft (switching, signing out): save what is waiting.
      flush();
    };
  }, [flush]);

  return { status, schedule, flush };
}
