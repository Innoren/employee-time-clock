import { unstable_rethrow } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageUnavailable({
  title = "Time Clock is temporarily unavailable",
  detail = "We could not load this page. Your punches are still saved — try again in a moment.",
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
      <Button asChild>
        <Link href="/clock">Back to clock</Link>
      </Button>
    </div>
  );
}

export async function renderPage(render: () => Promise<ReactNode>) {
  try {
    return await render();
  } catch (error) {
    unstable_rethrow(error);
    return <PageUnavailable />;
  }
}
