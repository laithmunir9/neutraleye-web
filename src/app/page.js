"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BiasDetectionFlowGraphic from "@/components/BiasDetectionFlowGraphic/BiasDetectionFlowGraphic";
import styles from "./page.module.css";

const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/neutraleye-bias-checker/fdkachmcdaebefhpkpjapoglbiakoffe";

const DEMO_OUTPUTS = {
  bias: {
    status: "result",
    biasLevel: "Moderate bias detected",
    summary:
      "This article uses emotionally weighted wording, gives more detail to one side of the argument, and leaves competing context underexplained.",
    examples: [
      "Supporters are described as experts, while critics are framed as obstructionist.",
      "The article centers policy benefits but omits likely tradeoffs raised elsewhere.",
      "Quoted evidence appears only from sources that reinforce the article's main frame."
    ],
    sources: [
      "Compare coverage from Reuters, AP News, and BBC News.",
      "Read a subject-matter explainer before evaluating the claims."
    ],
    recommendations: [
      "Cross-check factual claims against a wire service.",
      "Look for reporting that includes the missing counterargument."
    ],
    confidence: "84%"
  },
  neutral: {
    status: "result",
    biasLevel: "Low bias detected",
    summary:
      "The article keeps a restrained tone, separates reported facts from interpretation, and presents multiple perspectives with similar weight.",
    examples: [
      "Loaded language is minimal and attribution is clear.",
      "Competing positions are summarized without dismissive wording."
    ],
    sources: [
      "Reuters",
      "Associated Press"
    ],
    recommendations: [
      "Continue reading with normal source comparison habits."
    ],
    confidence: "78%"
  },
  nobias: {
    status: "clean",
    message: "No significant bias detected. Please feel free to continue reading."
  },
  error: {
    status: "error",
    message: "Could not analyze this page. Please open a real article or website and try again."
  }
};

const OUTPUT_PREVIEW = {
  biasLevel: "Moderate bias detected",
  summary:
    "The article favors one narrative through selective emphasis, stronger emotional wording, and limited competing context.",
  examples: [
    "Descriptors are harsher for one group than another.",
    "Key counterarguments are referenced briefly without supporting detail."
  ],
  sources: [
    "Reuters",
    "Associated Press",
    "BBC News"
  ],
  recommendations: [
    "Read a wire-service version of the same event.",
    "Check whether omitted context changes the interpretation."
  ],
  confidence: "84%"
};

const TRUST_ITEMS = [
  {
    title: "Privacy-safe by design",
    copy: "NeutralEye is designed for article analysis without turning the site into a tracking surface."
  },
  {
    title: "No data storage",
    copy: "The product is designed around transient analysis instead of saving article text long term."
  },
  {
    title: "Transparent AI explanation",
    copy: "The output shows why the article feels biased through tone, framing, and omission signals."
  },
  {
    title: "Not politically biased",
    copy: "NeutralEye reviews the writing itself rather than assigning a political label to the reader."
  }
];

const BLOG_PREVIEW = [
  {
    href: "/blog/what-is-media-bias",
    category: "Media bias",
    title: "What is media bias?",
    copy: "A practical explanation of wording, framing, sourcing, and omission."
  },
  {
    href: "/blog/how-to-detect-bias-in-news",
    category: "Critical thinking",
    title: "How to detect bias in news",
    copy: "A repeatable reading checklist for comparing articles and narratives."
  },
  {
    href: "/blog",
    category: "Media literacy",
    title: "More guides from the NeutralEye blog",
    copy: "Explore explainers on framing, propaganda, and responsible source comparison."
  }
];

const HERO_TRUST_PILLS = [
  "AI-powered",
  "Privacy-safe",
  "No data storage"
];

function ResultPanel({ data }) {
  if (data.status === "loading") {
    return (
      <div className={styles.resultBox} aria-live="polite">
        <p className={styles.resultLead}>
          Reading...
          <span className={styles.loadingDots} aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
      </div>
    );
  }

  if (data.status === "error") {
    return (
      <div className={styles.resultBox} aria-live="polite">
        <p className={styles.errorMessage}>{"\u26A0\uFE0F"} {data.message}</p>
      </div>
    );
  }

  if (data.status === "clean") {
    return (
      <div className={styles.resultBox} aria-live="polite">
        <p className={styles.successMessage}>{"\u2705"} {data.message}</p>
      </div>
    );
  }

  return (
    <div className={styles.resultBox} aria-live="polite">
      <div className={styles.resultSection}>
        <strong>Bias Level</strong>
        <p>{data.biasLevel}</p>
      </div>
      <div className={styles.resultSection}>
        <strong>Summary</strong>
        <p>{data.summary}</p>
      </div>
      <div className={styles.resultSection}>
        <strong>Examples of Bias</strong>
        <ul>
          {data.examples.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={styles.resultSection}>
        <strong>Suggested Sources</strong>
        <ul>
          {data.sources.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={styles.resultSection}>
        <strong>Recommendations</strong>
        <ul>
          {data.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={styles.resultSection}>
        <strong>Analysis Confidence</strong>
        <p>{data.confidence}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [demoMode, setDemoMode] = useState("bias");
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    if (!isDemoLoading) return undefined;

    const timer = window.setTimeout(() => {
      setIsDemoLoading(false);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isDemoLoading]);

  const demoState = isDemoLoading ? { status: "loading" } : DEMO_OUTPUTS[demoMode];

  function triggerDemo(nextMode) {
    setDemoMode(nextMode);
    setIsDemoLoading(true);
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.wordmark} aria-label="NeutralEye home">
          <Image src="/neutraleye-logo-48.png" alt="" width={32} height={32} />
          <span>NeutralEye</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <a href="#product">Product</a>
          <a href="#how-it-works">How it works</a>
          <Link href="/blog">Blog</Link>
          <a href="#about">About</a>
        </nav>

        <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.primaryButton}>
          Install Extension
        </a>
      </header>

      <section className={styles.hero} id="product">
        <div className={styles.heroHeader}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>AI-powered news bias analysis</p>
            <h1>Detect bias in any news article — instantly.</h1>
            <p className={styles.subheadline}>
              NeutralEye analyzes tone, framing, and omission so readers can understand how a story is being shaped,
              not just where it was published.
            </p>
            <div className={styles.heroPills} aria-label="Product trust signals">
              {HERO_TRUST_PILLS.map((item) => (
                <span key={item} className={styles.heroPill}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.heroGraphicColumn}>
            <p className={styles.heroSummaryLabel}>How NeutralEye works</p>
            <BiasDetectionFlowGraphic />
          </div>
        </div>

        <div className={styles.productStage}>
          <div className={styles.productLead}>
            <div className={styles.productStageHeader}>
              <div>
                <p className={styles.productStageLabel}>Try NeutralEye</p>
                <h2>The demo is the product.</h2>
              </div>
              <div className={styles.heroActions}>
                <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.primaryButton}>
                  Install Extension
                </a>
                <a href="#demo" className={styles.secondaryButton}>
                  Try Demo
                </a>
              </div>
            </div>

            <div className={styles.productStageGrid}>
              <div className={styles.heroInputShell}>
                <label className={styles.inputLabel} htmlFor="hero-demo-input">
                  Paste a URL or article text
                </label>
                <div className={styles.heroInputRow}>
                  <input
                    id="hero-demo-input"
                    className={styles.input}
                    value="https://example.com/news/article"
                    readOnly
                    aria-readonly="true"
                  />
                  <a href="#demo" className={styles.secondaryButton}>
                    Try Demo
                  </a>
                </div>
                <p className={styles.inputHint}>Works best with public article URLs or a full article body.</p>
              </div>

              <div className={styles.productOutput}>
                <p className={styles.productOutputLabel}>Structured output</p>
                <ResultPanel data={OUTPUT_PREVIEW} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="demo">
        <div className={styles.sectionHeading}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Live Demo</p>
            <h2>Understand the product, then use it immediately.</h2>
            <p>
              The demo mirrors the extension flow closely: input, loading, then a structured explanation focused on
              writing-level bias.
            </p>
          </div>
          <div className={styles.sectionNote}>
            <strong>Conversion flow</strong>
            <p>Read the product promise, test an article, review the trust signals, then install the extension.</p>
          </div>
        </div>

        <div className={styles.demoShell}>
          <div className={styles.demoGrid}>
            <div className={styles.demoPanel}>
              <div className={styles.demoPanelHeader}>
                <div>
                  <p className={styles.productStageLabel}>Input</p>
                  <h3>Paste URL or text</h3>
                </div>
                <span className={styles.demoBadge}>Interactive demo</span>
              </div>
              <label className={styles.inputLabel} htmlFor="demo-text">
                Article input
              </label>
              <textarea
                id="demo-text"
                className={styles.textarea}
                readOnly
                value="Paste any public news article URL or article text here to inspect framing, tone, and omission."
              />
              <div className={styles.demoActions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => triggerDemo("bias")}
                  disabled={isDemoLoading}
                >
                  {isDemoLoading ? "Reading..." : "Try Demo"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => triggerDemo("nobias")}
                  disabled={isDemoLoading}
                >
                  No Bias Example
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => triggerDemo("error")}
                  disabled={isDemoLoading}
                >
                  Error Example
                </button>
              </div>
            </div>

            <div className={styles.demoOutputPanel}>
              <div className={styles.demoPanelHeader}>
                <div>
                  <p className={styles.productStageLabel}>Output</p>
                  <h3>Extension-matched result</h3>
                </div>
                <span className={styles.demoBadge}>Writing-level bias</span>
              </div>
              <ResultPanel data={demoState} />
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.deferredSection}`} id="how-it-works">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>How It Works</p>
          <h2>Three steps, no editorial labels.</h2>
          <p>NeutralEye expands the extension into a fuller product experience without changing the underlying result format.</p>
        </div>

        <div className={styles.threeUp}>
          <article className={styles.infoCard}>
            <span className={styles.stepNumber}>01</span>
            <h3>Extract article text</h3>
            <p>NeutralEye reads visible article content from a URL or pasted text.</p>
          </article>
          <article className={styles.infoCard}>
            <span className={styles.stepNumber}>02</span>
            <h3>Analyze framing and tone</h3>
            <p>AI checks wording, attribution, emphasis, and missing context that can steer interpretation.</p>
          </article>
          <article className={styles.infoCard}>
            <span className={styles.stepNumber}>03</span>
            <h3>Return structured explanation</h3>
            <p>You get a readable breakdown with examples, sources, recommendations, and confidence.</p>
          </article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.deferredSection}`}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Output Preview</p>
          <h2>The result stays identical in structure to the extension.</h2>
        </div>

        <div className={styles.outputFrame}>
          <ResultPanel data={OUTPUT_PREVIEW} />
        </div>
      </section>

      <section className={`${styles.section} ${styles.deferredSection}`}>
        <div className={styles.sectionHeading}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Trust</p>
            <h2>Trust signals belong near the decision to try the product.</h2>
            <p>NeutralEye should feel safe to test before it asks for an install.</p>
          </div>
        </div>

        <div className={styles.featureSplit}>
          <div className={styles.featureLead}>
            <h3>Built for careful reading, not political sorting.</h3>
            <p>
              The site explains what the model sees in the article and keeps the emphasis on interpretation, not on
              pushing readers toward a side.
            </p>
            <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.primaryButton}>
              Install Extension
            </a>
            <a href="#demo" className={styles.secondaryButton}>
              Try Demo
            </a>
          </div>

          <div className={styles.trustGrid}>
            {TRUST_ITEMS.map((item) => (
              <article key={item.title} className={styles.infoCard}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.deferredSection}`} id="about">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Use Cases</p>
          <h2>Useful anywhere media literacy matters.</h2>
        </div>

        <div className={styles.threeUp}>
          <article className={styles.infoCard}>
            <h3>Students</h3>
            <p>Understand bias patterns quickly during assignments, debate prep, and media literacy work.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>Researchers</h3>
            <p>Compare framing across outlets and build faster first-pass analysis before deeper review.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>Everyday readers</h3>
            <p>Spot slant, missing context, and tone shifts before sharing or reacting to a story.</p>
          </article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.deferredSection}`}>
        <div className={styles.sectionHeading}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>From The Blog</p>
            <h2>Bias literacy content makes the product feel like a platform.</h2>
            <p>Use the blog to bring readers in from search, then move them toward the demo and extension install.</p>
          </div>
          <div className={styles.heroActions}>
            <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.primaryButton}>
              Install Extension
            </a>
            <a href="#demo" className={styles.secondaryButton}>
              Try Demo
            </a>
          </div>
        </div>

        <div className={styles.blogGrid}>
          {BLOG_PREVIEW.map((post) => (
            <article key={post.title} className={styles.blogCard}>
              <p className={styles.blogCategory}>{post.category}</p>
              <h3>{post.title}</h3>
              <p>{post.copy}</p>
              <Link href={post.href} className={styles.textLink}>
                Read article
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalCta} id="install">
        <div>
          <p className={styles.eyebrow}>Ready To Try NeutralEye?</p>
          <h2>Understand the article, then install the extension.</h2>
        </div>
        <div className={styles.heroActions}>
          <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className={styles.primaryButton}>
            Install Extension
          </a>
          <a href="#demo" className={styles.secondaryButton}>
            Try Demo
          </a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.wordmark}>
            <Image src="/neutraleye-logo-48.png" alt="" width={28} height={28} />
            <span>NeutralEye</span>
          </Link>
          <p className={styles.footerCopy}>Transparent AI analysis for tone, framing, and omission in news articles.</p>
        </div>

        <nav className={styles.footerNav} aria-label="Footer">
          <a href="#privacy">Privacy Policy</a>
          <Link href="/blog">Blog</Link>
          <a href="#about">About</a>
          <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
            Install Extension
          </a>
        </nav>
      </footer>
    </main>
  );
}
