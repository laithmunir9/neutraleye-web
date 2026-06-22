"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "./page.module.css";

const SUBJECTS = [
  "Report a result issue",
  "Bug or technical problem",
  "Question about NeutralEye",
  "Account or billing",
  "Other",
];

const CONTEXT_ITEMS = [
  {
    title: "Reporting a bad result?",
    body: "Include the article URL or a short paste of the text, what the result said, and what felt off about it. The more specific, the more useful.",
  },
  {
    title: "Reporting a bug?",
    body: "Tell us what you were doing, what you expected, and what happened instead. Browser and device are helpful if the issue is visual.",
  },
  {
    title: "Have a general question?",
    body: "Check the FAQ first — most common questions about scores, confidence, and privacy are answered there.",
  },
];

export default function SupportPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: SUBJECTS[0],
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <MarketingShell>
      <main className={styles.page}>

        {/* ── Hero ── */}
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Support</p>
          <h1>Get in touch</h1>
          <p className={styles.lead}>
            Report a result that seems wrong, flag a bug, or ask anything about
            how NeutralEye works. We read everything.
          </p>
        </header>

        {/* ── Two-column layout ── */}
        <div className={styles.layout}>

          {/* ── Left: context ── */}
          <aside className={styles.context}>
            <div className={styles.contextItems}>
              {CONTEXT_ITEMS.map((item) => (
                <div key={item.title} className={styles.contextItem}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>

            <div className={styles.contextLinks}>
              <p className={styles.contextLinksHeading}>Before you write</p>
              <Link href="/faq" className={styles.contextLink}>
                <span className={styles.contextLinkArrow}>→</span>
                FAQ — common questions answered
              </Link>
              <Link href="/methodology" className={styles.contextLink}>
                <span className={styles.contextLinkArrow}>→</span>
                How to read your result
              </Link>
              <Link href="/changelog" className={styles.contextLink}>
                <span className={styles.contextLinkArrow}>→</span>
                Changelog — known recent fixes
              </Link>
            </div>

            <div className={styles.responseNote}>
              <span className={styles.responseIcon} aria-hidden="true">◎</span>
              <p>We typically respond within one business day.</p>
            </div>
          </aside>

          {/* ── Right: form ── */}
          <div className={styles.formWrap}>
            {sent ? (
              <div className={styles.successState}>
                <span className={styles.successIcon} aria-hidden="true">✓</span>
                <h2>Message sent.</h2>
                <p>
                  We typically respond within one business day. You can also reach us at{" "}
                  <a href="mailto:contact@tryneutraleye.com">contact@tryneutraleye.com</a>.
                </p>
                <button
                  className={styles.resetBtn}
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" }); }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className={styles.formRow}>
                  <div className={styles.field}>
                    <label htmlFor="name" className={styles.label}>Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className={styles.input}
                      placeholder="Your name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="email" className={styles.label}>Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className={styles.input}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="subject" className={styles.label}>Subject</label>
                  <div className={styles.selectWrap}>
                    <select
                      id="subject"
                      name="subject"
                      className={styles.select}
                      value={form.subject}
                      onChange={handleChange}
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <span className={styles.selectArrow} aria-hidden="true">↓</span>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="message" className={styles.label}>Message</label>
                  <textarea
                    id="message"
                    name="message"
                    className={styles.textarea}
                    placeholder="Describe what happened, what you expected, or what you'd like to know…"
                    rows={7}
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                {error && <p className={styles.formError}>{error}</p>}

                <div className={styles.formFooter}>
                  <button type="submit" className={styles.submitBtn} disabled={sending}>
                    {sending ? "Sending…" : "Send message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </main>
    </MarketingShell>
  );
}
