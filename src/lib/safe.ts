import { unstable_rethrow } from "next/navigation";

export const ACTION_FAILED = "Something went wrong. Try again.";

export function failAction(
  error: unknown,
  message = ACTION_FAILED,
): { error: string } {
  unstable_rethrow(error);
  return { error: message };
}

export async function tryAction<T>(
  work: () => Promise<T>,
  message = ACTION_FAILED,
): Promise<T | { error: string }> {
  try {
    return await work();
  } catch (error) {
    return failAction(error, message);
  }
}

export function actionError(
  result: unknown,
): result is { error: string } {
  return Boolean(
    result &&
      typeof result === "object" &&
      "error" in result &&
      typeof (result as { error: unknown }).error === "string" &&
      (result as { error: string }).error,
  );
}
