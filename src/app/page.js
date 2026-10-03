import SiteShell from "@/components/SiteShell/SiteShell";
import Workbench from "@/components/Workbench/Workbench";
import Newsprint from "@/components/Newsprint/Newsprint";
import { resolveMode } from "@/components/Workbench/modes";

export const metadata = {
  title: "NeutralEye | See How an Article Frames the Story",
  description:
    "Paste a link or an article and see how it frames the story: the wording, sourcing and emphasis that shape it, each marked in the text.",
};

/* The homepage is the product. There is no explanation stacked above it: the
   mode toggle and the slot it controls are the page. */
export default async function Home({ searchParams }) {
  const params = await searchParams;
  const mode = resolveMode(typeof params?.mode === "string" ? params.mode : undefined);
  const savedId = typeof params?.id === "string" ? params.id : null;
  // Set by the /login redirect: open the sign-in overlay on arrival.
  const initialAuth =
    params?.auth === "signin" || params?.auth === "signup"
      ? { mode: params.auth, notice: typeof params.notice === "string" ? params.notice : null }
      : null;

  return (
    <SiteShell initialAuth={initialAuth} backdrop={<Newsprint />}>
      <main>
        <h1 className="sr-only">NeutralEye framing analysis</h1>
        {/* The mode and any saved-result id come from the server, so the first
            paint is the right mode rather than an empty column waiting on JS. */}
        <Workbench initialMode={mode} savedId={savedId} />
      </main>
    </SiteShell>
  );
}
