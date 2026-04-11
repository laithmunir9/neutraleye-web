export const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/neutraleye-bias-checker/fdkachmcdaebefhpkpjapoglbiakoffe";

export const BLOG_POSTS = [
  {
    slug: "what-is-media-bias",
    category: "Media bias",
    readTime: "5 min read",
    title: "What is media bias?",
    excerpt: "A practical guide to wording, framing, sourcing, and omission that goes beyond source labels.",
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
  {
    slug: "how-to-detect-bias-in-news",
    category: "Critical thinking",
    readTime: "6 min read",
    title: "How to detect bias in news",
    excerpt: "A repeatable checklist for comparing language, attribution, and missing context.",
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
  {
    slug: "how-framing-shapes-the-news",
    category: "Framing",
    readTime: "4 min read",
    title: "How framing shapes the news",
    excerpt: "Why overlapping facts can still push readers toward very different conclusions.",
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
];

export const BLOG_POSTS_BY_SLUG = Object.fromEntries(BLOG_POSTS.map((post) => [post.slug, post]));
