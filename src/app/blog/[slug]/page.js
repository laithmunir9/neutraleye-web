import Link from "next/link";
import styles from "./page.module.css";

const POSTS = {
  "what-is-media-bias": {
    title: "What is media bias?",
    category: "Media bias",
    intro:
      "Media bias is not only about where a story appears. It also shows up in wording, emphasis, sourcing, and what gets left out.",
    sections: [
      {
        title: "Tone shapes interpretation",
        body:
          "Two articles can cover the same facts but lead readers in different directions through adjectives, verbs, and the order in which claims appear."
      },
      {
        title: "Framing changes the center of gravity",
        body:
          "When one article treats an event as a policy success and another treats it as institutional failure, readers are not only learning facts. They are inheriting a narrative frame."
      },
      {
        title: "Omission matters too",
        body:
          "Missing context can be just as influential as explicit persuasion. A reader may never see the tradeoffs, background, or alternate interpretation needed for a fair assessment."
      }
    ]
  },
  "how-to-detect-bias-in-news": {
    title: "How to detect bias in news",
    category: "Critical thinking",
    intro:
      "Detecting bias starts with slowing down and checking how a story is assembled, not just whether you agree with it.",
    sections: [
      {
        title: "Scan for loaded wording",
        body:
          "Look for emotionally weighted verbs, asymmetrical descriptions, and labels that make one side feel legitimate while another feels suspect."
      },
      {
        title: "Compare attribution",
        body:
          "Notice who gets quoted directly, who is paraphrased, and whether expertise is distributed evenly across viewpoints."
      },
      {
        title: "Ask what is missing",
        body:
          "A strong reading habit is to identify the most relevant context that would change the meaning of the piece if it were included."
      }
    ]
  },
  "how-framing-shapes-the-news": {
    title: "How framing shapes the news",
    category: "Framing",
    intro:
      "Framing is the quiet architecture of a news story. It decides what the article treats as central, what it treats as background, and which interpretation feels most reasonable.",
    sections: [
      {
        title: "The same facts can point in different directions",
        body:
          "One article can frame a policy story around public safety while another frames it around civil liberties. The reported facts may overlap, but the reader is being guided toward a different conclusion."
      },
      {
        title: "Framing is often built through emphasis",
        body:
          "Writers frame stories through headline choices, ordering, source selection, and which details receive the most explanatory space."
      },
      {
        title: "Good comparison reading makes framing visible",
        body:
          "When you read multiple reports on the same event, the framing becomes easier to spot because you can see what one article highlights that another barely mentions."
      }
    ]
  }
};

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const post = POSTS[resolvedParams.slug] || POSTS["what-is-media-bias"];

  return (
    <main className={styles.page}>
      <Link href="/blog" className={styles.backLink}>
        Back to blog
      </Link>

      <article className={styles.article}>
        <p className={styles.category}>{post.category}</p>
        <h1>{post.title}</h1>
        <p className={styles.intro}>{post.intro}</p>

        <div className={styles.demoCallout}>
          <strong>Try the demo while you read</strong>
          <p>Paste a URL on the homepage to inspect tone, framing, and omission in the same flow described here.</p>
          <Link href="/#demo" className={styles.button}>
            Try Demo
          </Link>
        </div>

        {post.sections.map((section) => (
          <section key={section.title} className={styles.section}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
