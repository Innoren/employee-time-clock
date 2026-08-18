import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-medium">Page not found</p>
      <p className="text-sm text-muted-foreground">
        That link does not exist. Head back to the clock.
      </p>
      <Button asChild>
        <Link href="/clock">Open clock</Link>
      </Button>
    </div>
  );
}
