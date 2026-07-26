/**
 * StudyFlow Client-Side Security & Input Firewall
 * Provides client-side threat detection, rate limiting, and AI prompt protection.
 */

export interface FirewallCheckResult {
  isSafe: boolean;
  reason?: string;
  sanitized: string;
}

// Patterns known for XSS, script injection, or prototype poisoning attempts
const SUSPICIOUS_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
  /javascript\s*:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /__proto__/g,
  /prototype\s*\.\s*/g,
  /constructor\s*\.\s*/g,
];

// Patterns for potential LLM prompt injection / guardrail bypasses
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above)\s+instructions/gi,
  /system\s+prompt\s+override/gi,
  /you\s+are\s+now\s+DAN/gi,
  /reveal\s+your\s+system\s+instructions/gi,
  /jailbreak\s+mode/gi,
];

/**
 * Client-Side Input Firewall Guard
 * Inspects user input for script injections, malicious event handlers, and prototype poisoning.
 */
export function inspectInput(input: string, maxLength = 5000): FirewallCheckResult {
  if (!input || typeof input !== "string") {
    return { isSafe: true, sanitized: "" };
  }

  // Length check
  if (input.length > maxLength) {
    return {
      isSafe: false,
      reason: `Input exceeds maximum allowed size (${maxLength} characters).`,
      sanitized: input.slice(0, maxLength),
    };
  }

  // Check for suspicious script/event handler patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      // Reset pattern state for regex with global flag
      pattern.lastIndex = 0;
      return {
        isSafe: false,
        reason: "Potentially malicious script or attribute pattern detected.",
        sanitized: input.replace(pattern, "[BLOCKED]"),
      };
    }
    pattern.lastIndex = 0;
  }

  return {
    isSafe: true,
    sanitized: input.trim(),
  };
}

/**
 * AI Prompt Security Firewall
 * Inspects AI Buddy inputs for prompt injections or system prompt bypass attempts.
 */
export function inspectPrompt(prompt: string): FirewallCheckResult {
  const baseCheck = inspectInput(prompt, 2000);
  if (!baseCheck.isSafe) return baseCheck;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      pattern.lastIndex = 0;
      return {
        isSafe: false,
        reason: "Potential prompt injection or override pattern detected.",
        sanitized: prompt.replace(pattern, "[REDACTED]"),
      };
    }
    pattern.lastIndex = 0;
  }

  return { isSafe: true, sanitized: prompt };
}

/**
 * Token Bucket Rate Limiter for Client-Side Operations & API Calls
 */
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // Tokens per second
  private lastRefill: number;

  constructor(maxTokens = 5, refillRatePerSec = 1) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRatePerSec;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsedSeconds * this.refillRate);
    this.lastRefill = now;
  }

  /**
   * Attempts to consume 1 token. Returns true if request is permitted.
   */
  public tryConsume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Returns estimated wait time in seconds until next token is available.
   */
  public waitTimeSeconds(): number {
    this.refill();
    if (this.tokens >= 1) return 0;
    return Math.ceil((1 - this.tokens) / this.refillRate);
  }
}

// Global rate limiter instance for AI requests (Max 5 requests burst, refill 1 request per 3 seconds)
export const aiRateLimiter = new RateLimiter(5, 0.33);
