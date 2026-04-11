import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";

export function Hero195() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <Card className="relative overflow-hidden">
        <BorderBeam size={260} duration={16} />
        <CardHeader className="pb-4">
          <CardTitle>Hero195 source was not included in the snippet</CardTitle>
          <CardDescription>
            The pasted package provided shared primitives and dependencies, but not the actual <code>Hero195</code>
            component implementation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            I integrated the provided files into the repo&apos;s shadcn structure so the import path resolves and the
            design-system dependencies are available.
          </p>
          <p>
            If you send the real <code>Hero195</code> component body, I can wire it in directly without changing the
            demo route again.
          </p>
        </CardContent>
        <CardFooter>
          <Button>Ready for the real Hero195</Button>
        </CardFooter>
      </Card>
    </section>
  );
}
