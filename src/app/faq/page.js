import Link from "next/link";
import MarketingShell from "@/components/MarketingShell/MarketingShell";
import shell from "../marketing.module.css";
import styles from "./page.module.css";

export const metadata = {
  title: "FAQ | NeutralEye",
  description:
    "Reading a result, what each field measures, how data is handled, and the limits of the analysis.",
};

/* The "Direction & scores" and "Confidence score" sections were merged. Both
   described a Left-leaning / Center / Right-leaning label with a 0.00-1.00
   score, which the analyzer does not return, and four of their eight questions
   explained confidence twice. What the analyzer actually returns is documented
   on /methodology and matches the schema in src/lib/analysis.js. */
const SECTIONS = [
  {
    id: "result",
    label: "What the result says",
    questions: [
      {
        q: "What does the analyzer return?",
        a: "Framing strength, a direction, a confidence value, the quoted sentences behind it, the article type, and links to other coverage of the same story. The methodology page lists every field and what each one measures.",
      },
      {
        q: "What does direction mean?",
        a: "It names the subject the framing points at: toward or against a person, company, or position named in the story. It is not a political placement. There is no left, centre, or right result, because placing an article on a spectrum would require a fixed idea of where the centre sits.",
      },
      {
        q: "What does confidence measure?",
        a: "How consistently the signals repeated across the text. Below 0.40 means the evidence was thin, mixed, or ambiguous. Above 0.85 is rare, and reserved for framing that is explicit and repeated in the journalist's own sentences.",
      },
      {
        q: "Does high confidence mean the article is dishonest?",
        a: "No. A well-argued opinion column returns high confidence because its structure is deliberately consistent, and consistency is not dishonesty. Confidence describes how clear the pattern was, not what you should conclude from it.",
      },
      {
        q: "Why does the same outlet get different results on different articles?",
        a: "Because the unit of analysis is the text you submitted, not the outlet's reputation. A wire report and a column from the same publication are different objects and read differently. Labelling by outlet would be a shortcut that ignores how individual stories are written.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy",
    questions: [
      {
        q: "Is my article text stored when I run an analysis?",
        a: "Article text submitted for analysis is processed to generate a result and is not permanently stored by default. Signed-in users can opt in to saving their analysis history. This stores the result and metadata, not the full article text.",
      },
      {
        q: "What data does NeutralEye collect?",
        a: "For anonymous users: only the data needed to enforce rate limits (IP address, request count). For signed-in users: your email, analysis history if you opt in, and daily usage count. We do not sell data or share it with advertising networks. See the Privacy Policy for the full picture.",
      },
      {
        q: "Does the Chrome extension have access to everything I browse?",
        a: "No. The extension only activates when you click the NeutralEye icon. It reads the current tab's content only at that moment. It does not run in the background, track your browsing, or access tabs you haven't explicitly submitted for analysis.",
      },
      {
        q: "Do you use my article text to train AI models?",
        a: "No. Submitted text is used only to generate your analysis result. It is not retained for model training or used to improve the underlying AI beyond the current session.",
      },
    ],
  },
  {
    id: "limits",
    label: "Limits",
    questions: [
      {
        q: "How many analyses can I run?",
        a: "Ten per day, free, with a rate limit of 5 requests per minute to prevent abuse. The limit resets daily. There is no paid tier and nothing to buy.",
      },
      {
        q: "Does the extension have the same limits as the website?",
        a: "Yes. Both share the same ten analyses per day and the same rate limit. Signing in links both to your account so history saves across the two.",
      },
      {
        q: "Do I need an account?",
        a: "No. You can run analyses on the website without one. An account only adds saved history across devices.",
      },
    ],
  },
  {
    id: "how-it-works",
    label: "How it works",
    questions: [
      {
        q: "How does the analyzer decide what to flag?",
        a: "It checks five signal families together in one pass: tone (emotional loading, verb choices), framing (what the article centers vs. backgrounds), attribution (who gets quoted and how), source balance (distribution and credibility of sources), and omission (context that's missing). The result emerges from the pattern across all five, not any single signal in isolation.",
      },
      {
        q: "Can NeutralEye analyze any article or web page?",
        a: "It works best on articles: news reports, analysis pieces, opinion columns, and editorials. Very short texts, paywalled pages, navigation-heavy pages, and non-article content (product pages, forums) may produce unreliable results. The system flags these cases when it detects them.",
      },
      {
        q: "How accurate is the analysis?",
        a: "NeutralEye surfaces patterns. It doesn't claim certainty. Satire, irony, and unusual writing styles can resemble framing signals. The analysis should be treated as a structured second opinion that prompts closer reading, not as a definitive verdict. The evidence section exists precisely so you can check the reasoning yourself.",
      },
      {
        q: "Does NeutralEye work on paywalled articles?",
        a: "For URL submissions, the system attempts to extract article text. Paywalled pages that block extraction will return an error. You can always paste the article text directly if you have access, and that bypasses extraction entirely.",
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <MarketingShell>
      <main className={shell.page}>

        <section className={shell.hero}>
          <h1>Questions people actually ask</h1>
          <p className={shell.lead}>
            Mostly about what a result means and what happens to the text you submit. The short
            version of both: confidence measures consistency rather than truth, and the article
            text is not kept unless you ask for it.
          </p>
        </section>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className={shell.section}>
            <h2>{section.label}</h2>
            <div className={styles.list}>
              {section.questions.map((item) => (
                <details key={item.q} className={styles.item}>
                  <summary className={styles.question}>{item.q}</summary>
                  <p className={styles.answer}>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <section className={shell.cta}>
          <h2>Still stuck</h2>
          <p>Send the question directly. It reaches one person, not a queue.</p>
          <div className={shell.actions}>
            <a href="mailto:contact@tryneutraleye.com?subject=NeutralEye%20question" className={shell.btn}>Ask a question</a>
          </div>
        </section>

      </main>
    </MarketingShell>
  );
}
