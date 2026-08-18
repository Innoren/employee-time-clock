"use client";

import { useActionState, useState } from "react";
import { changePinAction } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PinDots, PinKeypad } from "@/components/pin-keypad";
import { INITIAL_PIN } from "@/lib/pin-constants";
import { actionError, tryAction } from "@/lib/safe";

export function ChangePinForm() {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const fillingConfirm = pin.length === 4;
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await tryAction(
        () => changePinAction(formData),
        "Could not update your PIN. Try again.",
      );
      return actionError(result) ? result : null;
    },
    null,
  );

  function addDigit(digit: string) {
    if (pin.length < 4) {
      setPin((current) => current + digit);
      return;
    }
    if (confirm.length < 4) {
      setConfirm((current) => current + digit);
    }
  }

  function clear() {
    if (fillingConfirm && confirm.length > 0) {
      setConfirm("");
      return;
    }
    setPin("");
    setConfirm("");
  }

  function back() {
    if (confirm.length > 0) {
      setConfirm((current) => current.slice(0, -1));
      return;
    }
    setPin((current) => current.slice(0, -1));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="pin" value={pin} />
      <input type="hidden" name="confirm" value={confirm} />
      <div className="space-y-2">
        <Label>New PIN</Label>
        <PinDots pin={pin} />
      </div>
      <div className="space-y-2">
        <Label>Confirm PIN</Label>
        <PinDots pin={confirm} />
      </div>
      <PinKeypad onDigit={addDigit} onClear={clear} onBack={back} />
      {pin === INITIAL_PIN ? (
        <Alert>
          <AlertDescription>Choose a PIN other than {INITIAL_PIN}.</AlertDescription>
        </Alert>
      ) : null}
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        className="h-11 w-full"
        disabled={pending || pin.length !== 4 || confirm.length !== 4 || pin === INITIAL_PIN}
      >
        {pending ? "Saving…" : "Save new PIN"}
      </Button>
    </form>
  );
}
