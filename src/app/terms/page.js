import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "../legal.module.css";

export const metadata = {
  title: "Terms & Conditions | NeutralEye",
  description: "Terms for using the NeutralEye website and analysis service."
};

const LAST_UPDATED = "September 6, 2026";

export default function TermsPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>
        <section className={styles.hero}>
          <h1>Terms & Conditions</h1>
          <p>
            These terms apply to the NeutralEye website, analysis service, and browser extension. By using
            NeutralEye you agree to these terms.
          </p>
          <span>Last updated: {LAST_UPDATED}</span>
        </section>

        <section className={styles.notice}>
          <strong>Important note</strong>
          <p>
            NeutralEye provides writing-pattern analysis for informational purposes only. It is not a final judgment
            about truth, intent, publisher credibility, legal rights, or professional advice.
          </p>
        </section>

        <section className={styles.content}>
          <article>
            <h2>Using NeutralEye</h2>
            <p>
              You may use NeutralEye to submit article text or URLs and receive analysis about tone, framing, omission,
              source balance, and related writing patterns. You are responsible for the content you submit and for how
              you interpret or use the results.
            </p>
          </article>

          <article>
            <h2>Accounts</h2>
            <p>
              You may use NeutralEye without an account. Creating an account lets you save analysis history across
              devices and access account-linked features. You are responsible for keeping your login credentials
              secure. You must not share your account or allow others to access it on your behalf. We may suspend or
              terminate accounts that violate these terms.
            </p>
          </article>

          <article>
            <h2>Cost</h2>
            <p>
              NeutralEye is free to use. There is no paid tier, no subscription, and no payment flow. We do not collect
              payment details and we do not charge for analyses. Usage is capped at a daily limit described on the{" "}
              <Link href="/tools">Tools page</Link> rather than metered against a plan.
            </p>
            <p>
              If a paid offering is introduced in the future, these terms will be updated before it becomes available,
              and no existing free access will be charged for retroactively.
            </p>
          </article>

          <article>
            <h2>No Professional Advice</h2>
            <p>
              NeutralEye output is informational. It is not legal, journalistic, academic, financial, medical, or other
              professional advice. You should independently evaluate articles and consult appropriate professionals
              where needed.
            </p>
          </article>

          <article>
            <h2>Acceptable Use</h2>
            <p>You agree not to use NeutralEye to:</p>
            <ul>
              <li>Break applicable laws or violate the rights of others.</li>
              <li>Submit content that you do not have the right to submit.</li>
              <li>Attempt to reverse engineer, overload, scrape, attack, or disrupt the service.</li>
              <li>Use results to harass, defame, threaten, or target another person or organization.</li>
              <li>Misrepresent NeutralEye output as a definitive factual ruling or official endorsement.</li>
              <li>Share, resell, or transfer account access to others.</li>
            </ul>
          </article>

          <article>
            <h2>User Content</h2>
            <p>
              You retain whatever rights you have in text, URLs, or other content you submit. By submitting content, you
              give NeutralEye permission to process it as needed to provide, secure, debug, and improve the service.
            </p>
          </article>

          <article>
            <h2>Accuracy And Limitations</h2>
            <p>
              NeutralEye may be incomplete, inaccurate, unavailable, or affected by article length, extraction quality,
              paywalls, sarcasm, unusual rhetoric, missing context, or model limitations. Do not rely on NeutralEye as
              your only source for evaluating an article.
            </p>
          </article>

          <article>
            <h2>Availability And Changes</h2>
            <p>
              We may update, suspend, limit, or discontinue any part of NeutralEye at any time, including the daily
              usage limit. We will provide reasonable notice of material changes where possible.
            </p>
          </article>

          <article>
            <h2>Third-Party Services</h2>
            <p>
              NeutralEye relies on third-party services for hosting, authentication, analysis, extraction, security,
              and infrastructure. These include Supabase for authentication and data storage. No payment processor is
              involved, because nothing is charged for. Those services have their own terms and policies.
            </p>
          </article>

          <article>
            <h2>Privacy</h2>
            <p>
              Use of NeutralEye is also governed by the <Link href="/privacy">Website Privacy Policy</Link>. The browser
              extension has a separate <Link href="/extension-privacy">Extension Privacy Policy</Link>.
            </p>
          </article>

          <article>
            <h2>Disclaimers</h2>
            <p>
              NeutralEye is provided "as is" and "as available" without warranties of any kind, to the fullest extent
              permitted by law. We do not guarantee that results will be accurate, complete, uninterrupted, secure, or
              suitable for your particular purpose.
            </p>
          </article>

          <article>
            <h2>Limitation Of Liability</h2>
            <p>
              To the fullest extent permitted by law, NeutralEye and its operators will not be liable for indirect,
              incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, or
              reputational harm arising from use of the service.
            </p>
          </article>

          <article>
            <h2>Changes To These Terms</h2>
            <p>
              We may update these terms as the service changes. The updated terms will be posted on this page with a new
              "Last updated" date.
            </p>
          </article>

          <article>
            <h2>Contact</h2>
            <p>
              Questions about these terms can be sent to{" "}
              <a href="mailto:legal@tryneutraleye.com">legal@tryneutraleye.com</a>.
            </p>
          </article>
        </section>
      </main>
    </MarketingShell>
  );
}
