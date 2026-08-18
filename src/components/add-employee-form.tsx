"use client";

import { useState, useTransition } from "react";
import { createEmployeeAction } from "@/app/actions/employees";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionError, tryAction } from "@/lib/safe";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddEmployeeForm({ domain }: { domain: string }) {
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState("employee");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; pin: string; name: string } | null>(
    null,
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        setError(null);
        startTransition(async () => {
          const result = await tryAction(
            () => createEmployeeAction(formData),
            "Could not create that account. Try again.",
          );
          if (actionError(result)) {
            setError(result.error);
            return;
          }
          if (result && "ok" in result && result.ok) {
            setCreated({ email: result.email, pin: result.pin, name: result.name });
            form.reset();
          }
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" className="h-10" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" className="h-10" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employee">Employee — book time only</SelectItem>
            <SelectItem value="supervisor">Supervisor — view all timesheets</SelectItem>
            <SelectItem value="admin">Admin — timesheets and team</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="role" value={role} />
        <p className="text-xs text-muted-foreground">
          Email is generated as first.last@{domain}
        </p>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {created ? (
        <Alert>
          <AlertTitle>Account created for {created.name}</AlertTitle>
          <AlertDescription>
            Share this once: {created.email} · PIN {created.pin}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="h-10">
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
