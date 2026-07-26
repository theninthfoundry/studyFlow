/**
 * StudyFlow Security Sanitizer Module
 * Provides helper functions for sanitizing text inputs and validating safe URLs.
 */

/**
 * Escapes potentially dangerous HTML characters in string inputs.
 */
export function sanitizeString(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates and sanitizes URLs to prevent dangerous protocol injection
 * (e.g. javascript:, data:, vbscript:).
 */
export function safeUrl(url: string, fallback = "#"): string {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();

  // Allow anchor links
  if (trimmed.startsWith("#")) return trimmed;

  try {
    const parsed = new URL(trimmed, window.location.origin);
    const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];

    if (allowedProtocols.includes(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    // If URL parsing fails, check relative paths
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
      return trimmed;
    }
  }

  return fallback;
}

/**
 * Checks if a URL is safe to open externally.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const sanitized = safeUrl(url, "");
  return sanitized !== "" && sanitized !== "#";
}

/**
 * Trims and limits string length to prevent memory exhaust / payload overflow attacks.
 */
export function limitLength(input: string, maxLength = 10000): string {
  if (!input) return "";
  return input.slice(0, maxLength);
}
