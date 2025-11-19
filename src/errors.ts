/**
 * TeDasuke - Custom error classes
 * Rich error context for TeamDesk API interactions
 */

import type { ApiError } from "./types.ts";

/**
 * Base error class for all TeamDesk-related errors
 */
export class TeamDeskError extends Error {
  /** HTTP status code */
  public status?: number;
  /** Detailed error information from API */
  public details?: ApiError[];
  /** The request URL that failed */
  public url?: string;

  constructor(message: string, options?: {
    status?: number;
    details?: ApiError[];
    url?: string;
  }) {
    super(message);
    this.name = "TeamDeskError";
    this.status = options?.status;
    this.details = options?.details;
    this.url = options?.url;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TeamDeskError);
    }
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends TeamDeskError {
  constructor(message: string, options?: {
    status?: number;
    url?: string;
  }) {
    super(message, options);
    this.name = "AuthenticationError";
  }
}

/**
 * Error thrown when a request is invalid (400-level errors)
 */
export class ValidationError extends TeamDeskError {
  constructor(message: string, options?: {
    status?: number;
    details?: ApiError[];
    url?: string;
  }) {
    super(message, options);
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when a resource is not found (404)
 */
export class NotFoundError extends TeamDeskError {
  constructor(message: string, options?: {
    url?: string;
  }) {
    super(message, { ...options, status: 404 });
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when rate limit is exceeded (429)
 */
export class RateLimitError extends TeamDeskError {
  /** When the rate limit will reset (if provided by API) */
  public retryAfter?: number;

  constructor(message: string, options?: {
    retryAfter?: number;
    url?: string;
  }) {
    super(message, { status: 429, url: options?.url });
    this.name = "RateLimitError";
    this.retryAfter = options?.retryAfter;
  }
}

/**
 * Error thrown when a server error occurs (500-level errors)
 */
export class ServerError extends TeamDeskError {
  constructor(message: string, options?: {
    status?: number;
    url?: string;
  }) {
    super(message, options);
    this.name = "ServerError";
  }
}
