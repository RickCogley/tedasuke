/**
 * TeDasuke - Utility functions
 * URL encoding, parameter building, and other helpers
 */

/**
 * Safely encode a table name or view name for use in URLs
 * TeamDesk requires proper URL encoding for spaces and special characters
 */
export function encodeTableName(name: string): string {
  return encodeURIComponent(name);
}

/**
 * Safely encode a view name for use in URLs
 */
export function encodeViewName(name: string): string {
  return encodeURIComponent(name);
}

/**
 * Build query string from parameters object
 * Handles arrays (multiple values for same key) and undefined values
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | string[] | undefined>,
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      // Handle arrays (e.g., multiple columns)
      for (const item of value) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
      }
    } else {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  }

  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

/**
 * Format a sort parameter for TeamDesk API
 * @param column - Column name to sort by
 * @param direction - Sort direction (ASC or DESC)
 * @returns Formatted sort string (e.g., "Date//DESC")
 */
export function formatSort(
  column: string,
  direction: "ASC" | "DESC" = "ASC",
): string {
  return `${column}//${direction}`;
}

/**
 * Validate that a number is within TeamDesk's pagination limits
 * Maximum 500 records per request
 */
export function validatePaginationLimit(limit: number): number {
  if (limit < 1) {
    throw new Error("Limit must be at least 1");
  }
  if (limit > 500) {
    throw new Error("TeamDesk maximum limit is 500 records per request");
  }
  return limit;
}

/**
 * Parse TeamDesk error response
 * TeamDesk returns errors in a specific format
 */
export function parseErrorResponse(
  body: unknown,
): { message: string; errors: Array<{ column?: string; message: string }> } {
  // If body is a string, return it as the message
  if (typeof body === "string") {
    return { message: body, errors: [{ message: body }] };
  }

  // If body is an object with errors array
  if (
    body && typeof body === "object" && "errors" in body &&
    Array.isArray(body.errors)
  ) {
    const errors = body.errors.map((err: unknown) => {
      if (typeof err === "object" && err !== null) {
        return {
          column: "column" in err ? String(err.column) : undefined,
          message: "message" in err ? String(err.message) : "Unknown error",
        };
      }
      return { message: String(err) };
    });

    const message = errors.map((e) =>
      e.column ? `${e.column}: ${e.message}` : e.message
    ).join("; ");

    return { message, errors };
  }

  // If body is an object with a message property
  if (body && typeof body === "object" && "message" in body) {
    const message = String(body.message);
    return { message, errors: [{ message }] };
  }

  // Fallback
  return { message: "Unknown error", errors: [{ message: "Unknown error" }] };
}
