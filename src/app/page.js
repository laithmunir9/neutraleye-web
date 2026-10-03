import SiteShell from "@/components/SiteShell/SiteShell";
import Workbench from "@/components/Workbench/Workbench";
import { resolveMode } from "@/components/Workbench/modes";

export const metadata = {
  title: "NeutralEye | See How an Article Frames the Story",
  description:
    "Paste an article and see how it frames the story: the wording, sourcing and emphasis that shape it, each marked in the text.",
};

/* The homepage is the product. There is no explanation stacked above it: the
   mode toggle and the slot it controls are the page. */
export default async function Home({ searchParams }) {
  const params = await searchParams;
  const mode = resolveMode(typeof params?.mode === "string" ? params.mode : undefined);
  const savedId = typeof params?.id === "string" ? params.id : null;

  return (
    <SiteShell>
      <main>
        <h1 className="sr-only">NeutralEye framing analysis</h1>
        {/* The mode and any saved-result id come from the server, so the first
            paint is the right mode rather than an empty column waiting on JS. */}
        <Workbench initialMode={mode} savedId={savedId} />
      </main>
    </SiteShell>
  );
}
