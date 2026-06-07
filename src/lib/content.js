export const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/neutraleye-bias-checker/fdkachmcdaebefhpkpjapoglbiakoffe";

export const BLOG_POSTS = [
  {
    slug: "what-is-media-bias",
    category: "Media bias",
    date: "April 23, 2026",
    showBrandTitle: true,
    readTime: "5 min read",
    title: "What is media bias?",
    excerpt: "A practical guide to wording, framing, sourcing, and omission that goes beyond source labels.",
    intro:
      "Media bias is not only about where a story appears. It also shows up in wording, emphasis, sourcing, and what gets left out.",
    sections: [
      {
        title: "Tone shapes interpretation",
        paragraphs: [
          "Two articles can cover the same facts but lead readers in different directions through adjectives, verbs, and the order in which claims appear.",
          "A report that says a group \"claimed\" something creates a different feeling than one that says the group \"explained\" it. A headline that foregrounds conflict will prepare the reader differently than one that foregrounds consequence or uncertainty.",
          "NeutralEye treats tone as a signal, not a verdict. The point is to notice when wording is doing interpretive work that a reader might otherwise absorb without pausing."
        ]
      },
      {
        title: "Framing changes the center of gravity",
        paragraphs: [
          "When one article treats an event as a policy success and another treats it as institutional failure, readers are not only learning facts. They are inheriting a narrative frame.",
          "Framing often appears through structure. Which detail arrives first? Which actor gets motive? Which consequence gets explained, and which one is left as a passing mention?",
          "That structure matters because most readers do not evaluate every sentence independently. They build a mental model as the story unfolds, and early framing can shape how later details are interpreted."
        ]
      },
      {
        title: "Omission matters too",
        paragraphs: [
          "Missing context can be just as influential as explicit persuasion. A reader may never see the tradeoffs, background, or alternate interpretation needed for a fair assessment.",
          "Omission is difficult because it is invisible inside a single article. A piece can feel complete while leaving out the strongest counterargument, the relevant history, or a source who would complicate the main claim.",
          "This is why NeutralEye separates evidence from confidence. It can point to visible signals in the text, but it should also remind readers where comparison reading may be necessary."
        ]
      }
    ]
  },
  {
    slug: "how-to-detect-bias-in-news",
    category: "Critical thinking",
    date: "April 18, 2026",
    readTime: "6 min read",
    title: "How to detect bias in news",
    excerpt: "A repeatable checklist for comparing language, attribution, and missing context.",
    intro:
      "Detecting bias starts with slowing down and checking how a story is assembled, not just whether you agree with it.",
    sections: [
      {
        title: "Scan for loaded wording",
        paragraphs: [
          "Look for emotionally weighted verbs, asymmetrical descriptions, and labels that make one side feel legitimate while another feels suspect.",
          "Loaded wording does not always look dramatic. Sometimes it is a small pattern: one actor \"warns\" while another \"complains,\" one proposal is \"ambitious\" while another is \"risky,\" one side is quoted with context while the other is reduced to a label.",
          "The goal is not to ban expressive language. The goal is to notice when language consistently nudges the reader toward one interpretation before the evidence has done the work."
        ]
      },
      {
        title: "Compare attribution",
        paragraphs: [
          "Notice who gets quoted directly, who is paraphrased, and whether expertise is distributed evenly across viewpoints.",
          "Attribution is one of the clearest ways a story distributes legitimacy. Direct quotes feel immediate and human. Paraphrases can feel distant. Anonymous or vague attribution can make a claim harder to evaluate.",
          "A useful habit is to ask whether the article gives each major side enough context to be understood on its own terms, even if the reporting ultimately challenges one side more strongly."
        ]
      },
      {
        title: "Ask what is missing",
        paragraphs: [
          "A strong reading habit is to identify the most relevant context that would change the meaning of the piece if it were included.",
          "This can mean prior reporting, policy background, source incentives, data limitations, or the strongest version of an opposing argument. Missing context does not always mean bad faith, but it can change how much weight a reader should give the story.",
          "When NeutralEye suggests follow-up reading, it is trying to preserve that habit: stay with the article, but keep enough distance to ask what else would matter."
        ]
      }
    ]
  },
  {
    slug: "what-confidence-scores-actually-measure",
    category: "Analysis",
    date: "May 6, 2026",
    showBrandTitle: true,
    readTime: "5 min read",
    title: "What confidence scores actually measure",
    excerpt: "A high confidence score does not mean an article is dishonest. It means the signals are consistent.",
    intro:
      "Confidence in NeutralEye does not describe how certain we are about a political judgment. It describes how clearly and consistently bias signals appear across the submitted text.",
    sections: [
      {
        title: "Confidence is about signal consistency, not truth",
        paragraphs: [
          "When NeutralEye returns a confidence score of 0.82, it means that tone, framing, sourcing, and attribution signals pointed in the same direction across most of the article. The signals were consistent and clear.",
          "It does not mean the article is wrong, dishonest, or that the underlying facts are disputed. A well-written opinion column can score high confidence because its rhetorical structure is deliberately consistent. A breaking news report with mixed sources may score low confidence because the picture is still developing.",
          "Understanding this distinction matters. Confidence measures pattern strength, not moral failure."
        ]
      },
      {
        title: "Low confidence has more than one cause",
        paragraphs: [
          "A low confidence score often gets misread as a good sign — as if the article passed inspection. But low confidence can mean several different things.",
          "It can mean the article is genuinely balanced and the signals genuinely cancel out. It can also mean the text was too short for a reliable read, the writing mixed tones inconsistently, or the article covered a fast-moving story where sourcing was necessarily thin.",
          "In those cases, low confidence is a flag for caution, not a clean bill of health. The right response is the same as with high confidence: read the evidence, check a second source, and decide what weight the analysis deserves given the context."
        ]
      },
      {
        title: "How to use confidence alongside the result",
        paragraphs: [
          "The most useful way to read confidence is in combination with the direction label and the evidence section, not in isolation.",
          "A high-confidence left-leaning result with multiple quoted examples of loaded phrasing is a stronger finding than a high-confidence label with no supporting evidence. The confidence score compresses a lot of information into a single number. The examples and summary are where the reasoning lives.",
          "Think of confidence as a volume dial, not a pass/fail gate. It tells you how strongly the signal was present. What you do with that signal is still a judgment call — and NeutralEye is designed to keep that judgment with the reader."
        ]
      }
    ]
  },
  {
    slug: "source-balance-and-why-it-matters",
    category: "Media literacy",
    date: "April 30, 2026",
    readTime: "6 min read",
    title: "Source balance and why it matters",
    excerpt: "Counting sources tells you very little. Who they are, what they're allowed to say, and what they're not asked tells you more.",
    intro:
      "An article with six sources is not automatically balanced. Source balance is about distribution, diversity, and the terms on which each source is allowed to speak.",
    sections: [
      {
        title: "The number of sources is the wrong metric",
        paragraphs: [
          "A story can quote six sources and still present a single viewpoint if all six work in the same institution, share the same professional interest, or are drawn from one end of an expert spectrum.",
          "Source balance starts with asking who is being heard. Are the quoted experts independent of the institutions and outcomes described? Are the people most directly affected given space to speak, or are they referenced only in aggregate statistics?",
          "One well-chosen source from the other side of a policy debate can do more for reader understanding than five confirmatory quotes, even if the confirmatory quotes are technically accurate."
        ]
      },
      {
        title: "Attribution terms shape perceived credibility",
        paragraphs: [
          "Equal time is not always equal treatment. The terms on which a source is introduced — their title, their affiliation, the length of their quote — all shape how seriously readers take what follows.",
          "A think tank researcher introduced with full institutional context reads differently from an unnamed official or an anonymous source. Both may be telling the truth. But the reader's ability to evaluate the claim is very different in each case.",
          "NeutralEye flags attribution patterns partly because they reveal the implicit hierarchy of the story — whose voice carries authority, and whose carries doubt."
        ]
      },
      {
        title: "Missing voices are part of balance too",
        paragraphs: [
          "Some of the most significant sourcing problems are not about who is quoted badly, but about who is not quoted at all.",
          "A policy story that interviews legislators and think tank analysts but not the communities the policy will affect is technically sourced. But the absence of a critical perspective is itself a framing choice, even if unintentional.",
          "This is why NeutralEye separates omission from tone. Tone analysis looks at what is said. Omission analysis asks what is structurally missing. Both matter, and a good reading habit keeps both in view."
        ]
      }
    ]
  },
  {
    slug: "how-framing-shapes-the-news",
    category: "Framing",
    date: "April 11, 2026",
    showBrandTitle: true,
    readTime: "4 min read",
    title: "How framing shapes the news",
    excerpt: "Why overlapping facts can still push readers toward very different conclusions.",
    intro:
      "Framing is the quiet architecture of a news story. It decides what the article treats as central, what it treats as background, and which interpretation feels most reasonable.",
    sections: [
      {
        title: "The same facts can point in different directions",
        paragraphs: [
          "One article can frame a policy story around public safety while another frames it around civil liberties. The reported facts may overlap, but the reader is being guided toward a different conclusion.",
          "Neither frame is automatically wrong. The issue is whether the article lets the reader see the frame clearly enough to evaluate it.",
          "Good analysis should show the frame without pretending that every framing choice is manipulation. Reporting always has a shape. Bias detection becomes useful when it can describe that shape precisely."
        ]
      },
      {
        title: "Framing is often built through emphasis",
        paragraphs: [
          "Writers frame stories through headline choices, ordering, source selection, and which details receive the most explanatory space.",
          "A short quote near the end of an article does not carry the same force as the same quote placed above the fold. A caveat mentioned once may not balance a claim repeated throughout the piece.",
          "NeutralEye looks for these patterns because emphasis is one of the places where reader direction becomes visible."
        ]
      },
      {
        title: "Good comparison reading makes framing visible",
        paragraphs: [
          "When you read multiple reports on the same event, the framing becomes easier to spot because you can see what one article highlights that another barely mentions.",
          "Comparison reading also protects against overreacting to a single signal. One loaded phrase may be an accident. A repeated pattern across headline, sourcing, and omitted context deserves more attention.",
          "The strongest use of NeutralEye is not to replace judgment. It is to make the article easier to inspect so the reader can decide what context to read next."
        ]
      }
    ]
  }
];

export function getBlogPostSections(post) {
  return (post?.sections || []).map((section) => {
    const paragraphs = Array.isArray(section?.paragraphs)
      ? section.paragraphs
      : [section?.body];

    return {
      ...section,
      paragraphs: paragraphs.map((paragraph) => String(paragraph || "").trim()).filter(Boolean)
    };
  });
}

export const BLOG_POSTS_BY_SLUG = Object.fromEntries(BLOG_POSTS.map((post) => [post.slug, post]));
