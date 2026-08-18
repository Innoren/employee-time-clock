"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionError, tryAction } from "@/lib/safe";
import { Delete } from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "alex.rivera@riverside.demo", pin: "1001", label: "Manager" },
  { email: "maria.chen@riverside.demo", pin: "4821", label: "Crew lead" },
  { email: "james.okonkwo@riverside.demo", pin: "7390", label: "Technician" },
  { email: "priya.shah@riverside.demo", pin: "1564", label: "Technician" },
];

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await tryAction(
        () => loginAction(formData),
        "Could not sign in. Try again.",
      );
      return actionError(result) ? result : null;
    },
    null,
  );

  function addDigit(digit: string) {
    setPin((current) => (current.length < 4 ? current + digit : current));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="pin" value={pin} />
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@riverside.demo"
          className="h-11 text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>4-digit PIN</Label>
        <div className="flex justify-center gap-3 py-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className="flex size-12 items-center justify-center rounded-xl border border-border bg-input/30 font-mono text-xl"
            >
              {pin[index] ? "•" : ""}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <Button
              key={digit}
              type="button"
              variant="secondary"
              className="h-14 text-xl"
              onClick={() => addDigit(digit)}
            >
              {digit}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="h-14"
            onClick={() => setPin("")}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-14 text-xl"
            onClick={() => addDigit("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-14"
            onClick={() => setPin((current) => current.slice(0, -1))}
          >
            <Delete />
          </Button>
        </div>
      </div>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="h-11 w-full" disabled={pending || pin.length !== 4}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Demo accounts
        </p>
        <div className="grid gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                setEmail(account.email);
                setPin(account.pin);
              }}
            >
              <span>
                <span className="block font-medium">{account.label}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {account.email}
                </span>
              </span>
              <span className="font-mono text-muted-foreground">{account.pin}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
