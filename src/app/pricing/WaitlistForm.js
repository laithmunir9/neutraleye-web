"use client";

import { useState } from "react";
import styles from "./WaitlistForm.module.css";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className={styles.success}>
        <span className={styles.successMark} aria-hidden="true">✓</span>
        <span>You&apos;re on the list, we&apos;ll reach out when Pro launches.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <p className={styles.label}>Get notified when Pro launches.</p>
      <div className={styles.row}>
        <input
          type="email"
          className={`${styles.input}${error ? ` ${styles.inputError}` : ""}`}
          placeholder="your@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          autoComplete="email"
          aria-label="Email address for Pro waitlist"
          disabled={loading}
        />
        <button type="submit" className={styles.btn} disabled={loading}>
          {loading ? "..." : "Notify me"}
        </button>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </form>
  );
}
