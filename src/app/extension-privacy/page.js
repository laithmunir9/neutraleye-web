import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "../legal.module.css";

export const metadata = {
  title: "Extension Privacy Policy | NeutralEye",
  description: "How the NeutralEye browser extension handles article and browser data."
};

const LAST_UPDATED = "June 22, 2026";

export default function ExtensionPrivacyPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Legal</p>
          <h1>Extension Privacy Policy</h1>
          <p>
            This policy explains how the NeutralEye browser extension handles article content, page URLs, account
            data, and extension data when you use it to analyze news articles.
          </p>
          <span>Last updated: {LAST_UPDATED}</span>
        </section>

        <section className={styles.notice}>
          <strong>Chrome Web Store disclosure</strong>
          <p>
            The extension uses user data only to provide and improve NeutralEye's user-facing article analysis feature.
            We do not sell user data, use it for targeted advertising, or collect browsing activity in the background
            for unrelated purposes.
          </p>
        </section>

        <section className={styles.content}>
          <article>
            <h2>Information The Extension May Process</h2>
            <p>Depending on how you use the extension, it may process:</p>
            <ul>
              <li>The URL of the current page when you ask NeutralEye to analyze it.</li>
              <li>Readable article text extracted from the active page.</li>
              <li>Article text that you manually paste or submit through the extension interface.</li>
              <li>Analysis results returned by NeutralEye, including summary, confidence, examples, and recommendations.</li>
              <li>If you sign in to the extension: your email address, authentication token, and account ID, used to identify your account and enforce daily usage limits.</li>
              <li>Extension settings, status, and saved results stored locally in your browser.</li>
              <li>Basic technical data needed for security, debugging, error handling, and service reliability.</li>
            </ul>
          </article>

          <article>
            <h2>When Data Is Collected</h2>
            <p>
              The extension is designed to process article content when you use the extension's interface to request an
              analysis. It is not intended to continuously monitor your browsing history or analyze pages in the
              background without a user-facing action.
            </p>
          </article>

          <article>
            <h2>How Information Is Used</h2>
            <p>Information processed by the extension is used to:</p>
            <ul>
              <li>Identify readable article content on the active page.</li>
              <li>Send the article or submitted text to NeutralEye's analysis service.</li>
              <li>Generate bias-signal analysis, structured results, and confidence information.</li>
              <li>Show results inside the extension or linked NeutralEye web experience.</li>
              <li>Authenticate signed-in users and enforce per-account daily usage limits.</li>
              <li>Maintain, debug, secure, and improve the extension and analysis service.</li>
            </ul>
          </article>

          <article>
            <h2>Accounts And Authentication</h2>
            <p>
              The extension supports optional sign-in for users with a NeutralEye account. Signing in is not required
              to use the extension. If you sign in, your authentication token is stored locally in the extension and
              used to identify your account when making analysis requests. Signed-in users have a shared daily usage
              limit across the extension and website. Sign-up is available on the NeutralEye website only; the
              extension supports sign-in only.
            </p>
          </article>

          <article>
            <h2>Sharing And Transfers</h2>
            <p>
              The extension may transmit article URLs, article text, extracted content, and request metadata to
              NeutralEye's servers and service providers that help provide the analysis, such as hosting, security,
              logging, extraction, and AI analysis providers.
            </p>
            <p>
              We do not sell extension user data. We do not use or transfer extension user data for personalized,
              retargeted, or interest-based advertising.
            </p>
          </article>

          <article>
            <h2>Human Access</h2>
            <p>
              We do not use submitted extension data for routine human review. Human access may occur only when needed
              for support you request, security and abuse investigation, legal compliance, or with your consent.
            </p>
          </article>

          <article>
            <h2>Permissions</h2>
            <p>
              The extension requests only the permissions needed to provide its article analysis feature. Browser
              permissions may allow the extension to read page content or the active tab when necessary to perform the
              analysis you request.
            </p>
          </article>

          <article>
            <h2>Data Storage</h2>
            <p>
              Extension data is stored in two places, depending on how you use the extension:
            </p>
            <ul>
              <li>
                <strong>Local browser storage:</strong> Extension settings, authentication tokens, and locally saved
                results are stored in your browser using the extension&apos;s local storage. This data stays on your
                device and can be removed by clearing browser storage, using browser extension controls, or
                uninstalling the extension.
              </li>
              <li>
                <strong>Server-side storage:</strong> If you are signed in, analysis results may be saved to your
                NeutralEye account on our servers, hosted by our database provider (Supabase). Your email address,
                account ID, and saved analyses are stored securely in our cloud infrastructure.
              </li>
            </ul>
            <p>
              If you use the extension without signing in, no data is stored on our servers. Analysis requests are
              processed and the results are returned to your browser without being saved server-side.
            </p>
          </article>

          <article>
            <h2>Data Retention</h2>
            <p>
              Locally stored extension data remains in your browser until you remove it or uninstall the extension.
            </p>
            <p>
              If you have a NeutralEye account, your account data and saved analyses are retained for as long as your
              account is active. You can request deletion of your account and all associated data by contacting us. When
              your account is deleted, your saved analyses and account information are removed from our servers.
            </p>
            <p>
              Server-side operational records, such as error logs and security logs, are kept only as long as reasonably
              needed to operate, secure, debug, or comply with legal obligations for the service.
            </p>
          </article>

          <article>
            <h2>Security</h2>
            <p>
              We use reasonable technical and organizational safeguards designed to protect information processed by the
              extension. Account data is protected using industry-standard authentication practices, and server-side data
              is stored using encrypted, access-controlled cloud infrastructure. No online service can guarantee absolute
              security.
            </p>
          </article>

          <article>
            <h2>Your Choices</h2>
            <ul>
              <li>You can choose when to run analysis.</li>
              <li>You can avoid analyzing private, sensitive, or confidential pages.</li>
              <li>You can use the extension without signing in.</li>
              <li>You can sign out at any time to remove your authentication token from the extension.</li>
              <li>You can uninstall the extension at any time.</li>
              <li>You can use the NeutralEye website instead of the extension when you prefer to paste text manually.</li>
            </ul>
          </article>

          <article>
            <h2>Related Policies</h2>
            <p>
              For use of the NeutralEye website, read the <Link href="/privacy">Website Privacy Policy</Link>. For the
              website terms, read the <Link href="/terms">Terms & Conditions</Link>.
            </p>
          </article>

          <article>
            <h2>Contact</h2>
            <p>
              Questions about this extension policy can be sent to{" "}
              <a href="mailto:legal@tryneutraleye.com">legal@tryneutraleye.com</a>.
            </p>
          </article>
        </section>
      </main>
    </MarketingShell>
  );
}
