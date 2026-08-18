export const INITIAL_PIN = "1234";

export function isPin(value: string) {
  return /^\d{4}$/.test(value);
}
