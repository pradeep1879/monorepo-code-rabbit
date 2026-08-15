export function getCheckoutUrl(result: unknown): string | null {
  if (
    result &&
    typeof result === "object" &&
    "url" in result &&
    typeof result.url === "string"
  ) {
    return result.url;
  }

  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    result.data &&
    typeof result.data === "object" &&
    "url" in result.data &&
    typeof result.data.url === "string"
  ) {
    return result.data.url;
  }

  return null;
}

export function isAlreadyActiveSubscriptionError(
  error: unknown
): boolean {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message.includes("AlreadyActiveSubscriptionError");
  }

  try {
    return JSON.stringify(error).includes("AlreadyActiveSubscriptionError");
  } catch {
    return false;
  }
}
