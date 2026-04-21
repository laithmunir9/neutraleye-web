import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "../legal.module.css";

export const metadata = {
  title: "Website Privacy Policy | NeutralEye",
  description: "How NeutralEye handles information submitted through the website."
};

const LAST_UPDATED = "April 21, 2026";

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Legal</p>
          <h1>Website Privacy Policy</h1>
          <p>
            This policy explains how NeutralEye handles information submitted through the NeutralEye website,
            including the analyzer workspace.
          </p>
          <span>Last updated: {LAST_UPDATED}</span>
        </section>

        <section className={styles.notice}>
          <strong>Plain-language summary</strong>
          <p>
            NeutralEye is built to analyze article text, not to build advertising profiles. We do not sell personal
            data, and we do not use submitted articles for targeted advertising.
          </p>
        </section>

        <section className={styles.content}>
          <article>
            <h2>Information We Collect</h2>
            <p>Depending on how you use the website, NeutralEye may process:</p>
            <ul>
              <li>Article text that you paste into the analyzer.</li>
              <li>Article URLs that you submit for extraction and analysis.</li>
              <li>Extracted article text returned from a submitted URL.</li>
              <li>Analysis results, confidence values, examples, recommendations, and related metadata.</li>
              <li>Basic technical information, such as browser type, device information, timestamps, error logs, and request metadata.</li>
              <li>Saved analysis history stored locally in your browser, if you use features that save or revisit results.</li>
            </ul>
          </article>

          <article>
            <h2>How We Use Information</h2>
            <p>We use information to:</p>
            <ul>
              <li>Provide article extraction, bias-signal analysis, and structured output.</li>
              <li>Display saved results, comparison views, and history features in the product.</li>
              <li>Maintain, debug, secure, and improve the reliability of the service.</li>
              <li>Investigate errors, abuse, security incidents, or misuse of the service.</li>
              <li>Comply with legal obligations if required.</li>
            </ul>
          </article>

          <article>
            <h2>How Information Is Shared</h2>
            <p>
              We may share submitted text, URLs, extracted content, and related request metadata with service providers
              that help operate NeutralEye, such as hosting, logging, security, article extraction, and AI analysis
              providers. These providers process information so NeutralEye can deliver the requested analysis.
            </p>
            <p>
              We do not sell submitted article content or personal data. We do not share submitted article content for
              targeted advertising.
            </p>
          </article>

          <article>
            <h2>Local Storage And Saved Results</h2>
            <p>
              Some NeutralEye features may store analysis history locally in your browser. Local browser storage stays
              on your device unless your browser, device settings, or another service syncs it. You can clear saved
              browser data through your browser settings.
            </p>
          </article>

          <article>
            <h2>Retention</h2>
            <p>
              Locally saved results remain in your browser until you delete them or clear browser storage. Server-side
              operational records, if created, are kept only as long as reasonably needed to operate, secure, debug, or
              comply with legal obligations for the service.
            </p>
          </article>

          <article>
            <h2>Your Choices</h2>
            <ul>
              <li>You can use Paste Text mode instead of submitting a URL.</li>
              <li>You can avoid submitting sensitive or private content for analysis.</li>
              <li>You can clear locally saved NeutralEye data through your browser settings.</li>
              <li>You can stop using the service at any time.</li>
            </ul>
          </article>

          <article>
            <h2>Security</h2>
            <p>
              We use reasonable technical and organizational safeguards designed to protect information processed by
              NeutralEye. No online service can guarantee absolute security.
            </p>
          </article>

          <article>
            <h2>Extension Privacy Policy</h2>
            <p>
              The NeutralEye browser extension has a separate privacy policy because browser extensions can involve
              different permissions and browser data. Read the{" "}
              <Link href="/extension-privacy">Extension Privacy Policy</Link>.
            </p>
          </article>

          <article>
            <h2>Changes</h2>
            <p>
              We may update this policy as NeutralEye changes. The updated policy will be posted on this page with a
              new “Last updated” date.
            </p>
          </article>

          <article>
            <h2>Contact</h2>
            <p>
              Questions about this policy can be sent to{" "}
              <a href="mailto:biaschecker.app@gmail.com">biaschecker.app@gmail.com</a>.
            </p>
          </article>
        </section>
      </main>
    </MarketingShell>
  );
}
