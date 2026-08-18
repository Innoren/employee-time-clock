"use client";

import { useState, useTransition } from "react";
import { setEmployeeActiveAction } from "@/app/actions/employees";
import { Button } from "@/components/ui/button";
import { actionError, tryAction } from "@/lib/safe";

export function ToggleActiveButton({
  employeeId,
  active,
}: {
  employeeId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={active ? "outline" : "secondary"}
        size="sm"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await tryAction(
              () => setEmployeeActiveAction(employeeId, !active),
              "Could not update that account.",
            );
            if (actionError(result)) setError(result.error);
          });
        }}
      >
        {active ? "Deactivate" : "Reactivate"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
