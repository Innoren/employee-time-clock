"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinDots, PinKeypad } from "@/components/pin-keypad";
import { actionError, tryAction } from "@/lib/safe";

export function LoginForm({ domain }: { domain: string }) {
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
          placeholder={`name@${domain}`}
          className="h-11 text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>4-digit PIN</Label>
        <PinDots pin={pin} />
        <PinKeypad
          onDigit={addDigit}
          onClear={() => setPin("")}
          onBack={() => setPin((current) => current.slice(0, -1))}
        />
      </div>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="h-11 w-full" disabled={pending || pin.length !== 4}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
