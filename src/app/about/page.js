import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
import styles from "./page.module.css";

const principles = [
  {
    number: "01",
    title: "Show the evidence",
    body: "Every result includes the exact language, sourcing patterns, and framing choices that shaped it. We never return a verdict without showing the reasoning. You should be able to open the article and check every claim we make.",
  },
  {
    number: "02",
    title: "Separate confidence from truth",
    body: "A high confidence score means the signals were consistent — not that the article was dishonest, or that we're certain about a political judgment. Confidence describes pattern strength. What you do with that pattern is still your call.",
  },
  {
    number: "03",
    title: "Keep the reader in control",
    body: "NeutralEye is designed to be a prompt, not a verdict. It surfaces what it found. It suggests what to read next. The conclusion belongs to you — and we think that's exactly how it should be.",
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <main className={styles.page}>

        {/* ── Hero ── */}
        <header className={styles.hero}>
          <p className={styles.eyebrow}>About</p>
          <h1>We built NeutralEye because reading the news got harder to trust.</h1>
        </header>

        {/* ── Origin essay ── */}
        <ScrollReveal>
          <section className={styles.essay}>
            <div className={styles.essayBody}>
              <p className={styles.dropcap}>
                The problem isn't that biased reporting exists. It always has. The problem is that most of it
                doesn't look like bias — it looks like news. The same event, covered by two outlets on the same
                day, can leave readers with completely different understandings of what happened, who was
                responsible, and what it means. Neither reader is lying to themselves. They just read different
                versions of the same story.
              </p>
              <p>
                We kept running into this. Reading an article and feeling like something was slightly off — a
                phrase that loaded a bit too much weight, a source list that all pointed one way, a counterargument
                that got one sentence while the main claim got six paragraphs. The signals were there. But
                catching them consistently, while reading quickly, is genuinely hard.
              </p>
              <p>
                So we built something to do it systematically — not to form opinions for readers, but to make the
                structure of a story visible enough that they could form their own.
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Pull quote ── */}
        <ScrollReveal>
          <div className={styles.pullQuoteWrap}>
            <blockquote className={styles.pullQuote}>
              <span className={styles.pullQuoteMark}>"</span>
              Bias isn't usually about lying. It's about what gets centered,
              what gets backgrounded, and what never gets mentioned at all.
            </blockquote>
          </div>
        </ScrollReveal>

        {/* ── Mission ── */}
        <ScrollReveal>
          <section className={styles.missionSection}>
            <div className={styles.missionIntro}>
              <h2>What we believe</h2>
              <p>
                Media literacy isn't about avoiding bias — it's about seeing it clearly enough
                to make your own judgment. NeutralEye is built on three commitments that shape
                every design decision we make.
              </p>
            </div>

            <div className={styles.principles}>
              {principles.map((p) => (
                <article key={p.number} className={styles.principle}>
                  <span className={styles.principleNumber}>{p.number}</span>
                  <div className={styles.principleContent}>
                    <h3>{p.title}</h3>
                    <p>{p.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* ── Why it matters ── */}
        <ScrollReveal>
          <section className={styles.essay}>
            <div className={styles.essayBody}>
              <h2 className={styles.essayHeading}>Why it matters now</h2>
              <p>
                Trust in media has been falling for years. But the response to that — avoiding news
                altogether, dismissing outlets wholesale, or only reading sources that already confirm
                what you believe — trades one problem for three worse ones.
              </p>
              <p>
                We think the better response is to read more carefully, not less. To ask how a story
                was built, not just whether it confirms your priors. NeutralEye is a tool for that kind
                of reading. It won't tell you the truth. But it can help you see the frame.
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* ── What we're not ── */}
        <ScrollReveal>
          <section className={styles.notSection}>
            <div className={styles.notInner}>
              <h2>What NeutralEye is not</h2>
              <div className={styles.notGrid}>
                <div className={styles.notItem}>
                  <span className={styles.notLabel}>Not a fact-checker</span>
                  <p>We analyze how stories are framed, not whether individual claims are true. Bias detection and fact-checking are different disciplines. We do one of them.</p>
                </div>
                <div className={styles.notItem}>
                  <span className={styles.notLabel}>Not a ratings agency</span>
                  <p>We don't score outlets or maintain a list of "biased" publications. Every result is specific to the text submitted — the same outlet can read very differently across different articles.</p>
                </div>
                <div className={styles.notItem}>
                  <span className={styles.notLabel}>Not a substitute for judgment</span>
                  <p>The analysis is a starting point, not a final word. We surface patterns and suggest context. Deciding what to believe, and what to read next, is still entirely yours.</p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── CTA ── */}
        <ScrollReveal>
          <section className={styles.cta}>
            <p className={styles.ctaEyebrow}>Try it yourself</p>
            <h2>Try it on an article you're already reading.</h2>
            <div className={styles.ctaActions}>
              <Link href="/analyze" className={styles.ctaBtn}>Open Analyzer</Link>
              <Link href="/how-it-works" className={styles.ctaLink}>How It Works →</Link>
            </div>
          </section>
        </ScrollReveal>

      </main>
    </MarketingShell>
  );
}
