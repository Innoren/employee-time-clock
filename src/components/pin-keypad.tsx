"use client";

import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PinDots({ pin }: { pin: string }) {
  return (
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
  );
}

export function PinKeypad({
  onDigit,
  onClear,
  onBack,
}: {
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBack: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
        <Button
          key={digit}
          type="button"
          variant="secondary"
          className="h-14 text-xl"
          onClick={() => onDigit(digit)}
        >
          {digit}
        </Button>
      ))}
      <Button type="button" variant="ghost" className="h-14" onClick={onClear}>
        Clear
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="h-14 text-xl"
        onClick={() => onDigit("0")}
      >
        0
      </Button>
      <Button type="button" variant="ghost" className="h-14" onClick={onBack}>
        <Delete />
      </Button>
    </div>
  );
}
