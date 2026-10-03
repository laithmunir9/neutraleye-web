"use client";

import { useState } from "react";
import styles from "./Workbench.module.css";

/*
 * Stands in for the writing companion until it exists. It describes what the
 * tool will do in the future tense and collects an address, nothing more: no
 * date, no feature list beyond the one promise that defines it.
 */
export default function WaitlistMode() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [joinedAs, setJoinedAs] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter an email address like name@example.com.");
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "write" }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          response.status === 429
            ? "Too many attempts from this connection. Wait a minute and try again."
            : body.error || "That did not go through. Try again in a moment."
        );
        setStatus("idle");
        return;
      }
      setJoinedAs(trimmed);
      setStatus("joined");
    } catch {
      setError("Could not reach NeutralEye. Check your connection and try again.");
      setStatus("idle");
    }
  }

  return (
    <div className={`${styles.frame} ${styles.writeFrame}`}>
      <h2 className={styles.writeLead}>It will not write for you.</h2>
      <p className={styles.writeBody}>
        Write will read your draft the way Read reads an article. It will point to the wording
        that takes a side, the claims that need a source, and what a reader may notice is
        missing. The fixing stays with you.
      </p>

      {status === "joined" ? (
        <p className={styles.writeDone} role="status">
          You are on the list. We will email {joinedAs} when Write opens.
        </p>
      ) : (
        <form className={styles.writeForm} onSubmit={handleSubmit} noValidate>
          <label htmlFor="write-email" className={styles.writeNote}>
            Write is not open yet. Leave your email and we will tell you when it is.
          </label>
          <div className={`${styles.actions} ${styles.writeActions}`}>
            <input
              id="write-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              className={styles.email}
              placeholder="you@example.com"
              value={email}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "write-email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
            />
            <button type="submit" className={styles.primary} disabled={status === "sending"}>
              {status === "sending" ? "Sending" : "Get early access"}
            </button>
          </div>
          {error ? (
            <p id="write-email-error" className={styles.fieldError} role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
