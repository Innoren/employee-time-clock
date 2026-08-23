"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-medium">Something went wrong</p>
      <p className="text-sm text-muted-foreground">
        This page hit an unexpected error. You can try again without losing your punches.
      </p>
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
