import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import AnalyzerCta from "@/components/AnalyzerCta/AnalyzerCta";
import HeroSystemVisualization from "@/components/HeroSystemVisualization/HeroSystemVisualization";
import styles from "./page.module.css";

export default function Home() {
  const trustMarkers = [
    { label: "Method visible", detail: "Signals stay named instead of collapsing into one opaque score." },
    { label: "Evidence attached", detail: "Quoted language, sourcing patterns, and framing choices stay visible in the output." },
    { label: "Confidence separated", detail: "Confidence describes signal consistency, not whether the article itself is true." },
    { label: "Reader controlled", detail: "Readers can inspect the result, compare context, and decide what to read next." }
  ];

  const processLog = [
    {
      time: "00:01",
      title: "Article intake",
      detail: "Paste text or a URL. NeutralEye treats the article as the source of record.",
      meta: "Input"
    },
    {
      time: "00:04",
      title: "Readable text extracted",
      detail: "Navigation, ads, and unrelated page furniture are removed before analysis.",
      meta: "Extraction"
    },
    {
      time: "00:08",
      title: "Bias signals checked",
      detail: "Tone, framing, attribution, source balance, and omitted counter-context are reviewed together.",
      meta: "Signals"
    },
    {
      time: "00:12",
      title: "Confidence separated",
      detail: "Confidence reflects how consistent the signals are, not whether the article is true.",
      meta: "Calibration"
    },
    {
      time: "00:16",
      title: "Evidence attached",
      detail: "Quoted examples and source suggestions make the output inspectable.",
      meta: "Trace"
    }
  ];

  const metrics = [
    {
      value: "5",
      label: "signal families"
    },
    {
      value: "0",
      label: "truth verdicts"
    },
    {
      value: "1",
      label: "evidence stack"
    }
  ];

  return (
    <MarketingShell>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroSystem}>
            <HeroSystemVisualization />
          </div>

          <div className={styles.heroText}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>Overview</p>
              <h1>See how an article moves the reader</h1>
              <p className={styles.lead}>
                NeutralEye reads tone, framing, sourcing, and omission, then returns quoted evidence and context for
                what to read next.
              </p>
            </div>

            <div className={styles.actions}>
              <Link href="/analyze" className={styles.primaryAction}>
                Open Analyzer
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.trust} aria-label="NeutralEye trust principles">
          {trustMarkers.map((marker) => (
            <article className={styles.trustItem} key={marker.label}>
              <span>{marker.label}</span>
              <p>{marker.detail}</p>
            </article>
          ))}
        </section>

        <section className={styles.value} id="analysis">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>How it works</p>
              <h2>One read from input to evidence</h2>
            </div>
          </div>

          <div className={styles.analysisSystem}>
            <div className={styles.processPanel} aria-label="NeutralEye analysis log">
              <div className={styles.metricRow}>
                {metrics.map((metric) => (
                  <div className={styles.metric} key={metric.label}>
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </div>
                ))}
              </div>

              <ol className={styles.timeline}>
                {processLog.map((step) => (
                  <li className={styles.timelineItem} key={step.title}>
                    <span className={styles.timelineNode} aria-hidden />
                    <div className={styles.timelineMeta}>
                      <span>{step.time}</span>
                      <span>{step.meta}</span>
                    </div>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <aside className={styles.outputPreview} aria-label="Example structured output">
              <div className={styles.previewHeader}>
                <span>Evidence packet</span>
                <strong>Review ready</strong>
              </div>
              <div className={styles.previewMetric}>
                <span>Reader direction</span>
                <strong>Framing pressure identified</strong>
              </div>
              <div className={styles.previewRows}>
                <span>Quoted phrase with reason</span>
                <span>Missing counter-context</span>
                <span>Source mix checked</span>
                <span>Next reading step</span>
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.cta}>
          <AnalyzerCta />
        </section>
      </main>
    </MarketingShell>
  );
}
