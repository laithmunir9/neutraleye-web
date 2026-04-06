import AppShell from "@/components/AppShell/AppShell";
import HeaderBar from "@/components/HeaderBar/HeaderBar";
import ResultCard from "@/components/ResultCard/ResultCard";
import styles from "./page.module.css";

export default function MethodologyPage() {
  return (
    <AppShell>
      <div className={styles.root}>
        <HeaderBar
          title="Methodology"
          subtitle="How NeutralEye evaluates tone, framing, omission, and confidence in an article."
        />
        <section className={styles.lead}>
          <div>
            <span className={styles.eyebrow}>What NeutralEye Measures</span>
            <h2>NeutralEye looks for bias in the writing, not a political label for the publisher.</h2>
          </div>
          <p>
            The system reviews how an article is written, including its tone, framing choices, source balance, and
            missing context, to estimate whether the piece pushes readers toward a particular interpretation.
          </p>
        </section>

        <section className={styles.grid}>
          <ResultCard title="Bias Level">
            <p>
              NeutralEye maps writing patterns into a directional score from -1.0 to +1.0. A score near zero usually
              means the article reads as more balanced or mixed in its framing.
            </p>
          </ResultCard>

          <ResultCard title="Analysis Confidence">
            <p>
              Confidence reflects how consistently the same signals appear across the article. It is not a claim that
              the article is factually true or false.
            </p>
          </ResultCard>

          <ResultCard title="What NeutralEye Checks">
            <ul>
              <li>Loaded or emotionally weighted wording</li>
              <li>Framing that favors one interpretation over another</li>
              <li>Source balance and attribution clarity</li>
              <li>Omissions that could change how the story is understood</li>
            </ul>
          </ResultCard>

          <ResultCard title="Limitations">
            <ul>
              <li>Short passages may not reveal the full framing of a story.</li>
              <li>Satire, irony, or unusual rhetoric can look like bias signals.</li>
              <li>Paywalls and weak extraction can reduce analysis quality.</li>
              <li>The result reflects writing patterns, not objective truth.</li>
            </ul>
          </ResultCard>
        </section>

        <ResultCard title="How To Read The Output">
          <div className={styles.guidance}>
            <article>
              <strong>Start with the summary</strong>
              <p>Read the overall explanation first, then move into the quoted evidence to see what shaped the result.</p>
            </article>
            <article>
              <strong>Treat confidence as consistency</strong>
              <p>Higher confidence usually means the same framing signals repeat across wording, sourcing, and context.</p>
            </article>
            <article>
              <strong>Retry weak extractions</strong>
              <p>If a page is blocked or only partially read, paste the article text directly for a cleaner result.</p>
            </article>
          </div>
        </ResultCard>
      </div>
    </AppShell>
  );
}
