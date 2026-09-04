import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import styles from "../marketing.module.css";

export const metadata = {
  title: "About | NeutralEye",
  description:
    "Why NeutralEye exists, what it commits to, and the things it deliberately does not do.",
};

// Principles, not a sequence, so they carry no numbering.
const PRINCIPLES = [
  {
    title: "Show the evidence",
    body: "Every result includes the exact language, sourcing patterns, and framing choices that shaped it. Nothing comes back as a verdict without the reasoning attached. You should be able to open the article and check every claim it makes.",
  },
  {
    title: "Separate confidence from truth",
    body: "A high confidence score means the signals were consistent, not that the article was dishonest, or that anyone is certain about a political judgment. Confidence describes pattern strength. What you do with that pattern is still your call.",
  },
  {
    title: "Keep the reader in control",
    body: "It is built to be a prompt, not a verdict. It surfaces what it found and suggests what to read next. The conclusion belongs to you, and that is exactly how it should be.",
  },
];

const NOT = [
  "It analyzes how stories are framed, not whether individual claims are true. Bias detection and fact-checking are different disciplines, and this does one of them.",
  "It does not score outlets or maintain a list of biased publications. Every result is specific to the text submitted, and the same outlet can read very differently across two articles.",
  "The analysis is a starting point, not a final word. It surfaces patterns and suggests context. Deciding what to believe, and what to read next, stays with you.",
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        <section className={styles.hero}>
          <h1>Reading the news got harder to trust</h1>
          <p className={styles.lead}>
            Not because outlets stopped reporting, but because the same set of facts now arrives
            shaped five different ways, and the shaping is the part nobody shows you. NeutralEye
            exists to make that shaping visible, with the evidence attached.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What it commits to</h2>
          <ul className={styles.rows}>
            {PRINCIPLES.map((p) => (
              <li key={p.title} className={styles.row}>
                <h3 className={styles.rowTitle}>{p.title}</h3>
                <p className={styles.rowBody}>{p.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>What it is not</h2>
          <div className={styles.measure}>
            {NOT.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Who is behind it</h2>
          <div className={styles.measure}>
            <p>
              One person. That is worth stating plainly, because it sets what you should expect:
              direct answers, fast changes, and no support queue. It also means the method is
              written down rather than held in a team&rsquo;s heads, which is why the analysis
              runs twice and reports where the two passes disagree.
            </p>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Try it on an article you are already reading</h2>
          <p>
            The judgment is easier to make on something you know well enough to argue with.
          </p>
          <div className={styles.actions}>
            <Link href="/analyze" className={styles.btn}>Open the analyzer</Link>
            <Link href="/how-it-works" className={styles.btnQuiet}>See how it works</Link>
          </div>
        </section>

      </main>
    </MarketingShell>
  );
}
