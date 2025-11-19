/**
 * TeDasuke - Main client class
 * TeamDesk/DBFlex REST API client with fluent interface
 */

import type {
  DatabaseSchema,
  TeamDeskConfig,
  TeamDeskRecord,
} from "./types.ts";
import { TableClient } from "./table.ts";
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TeamDeskError,
  ValidationError,
} from "./errors.ts";
import { parseErrorResponse } from "./utils.ts";

/**
 * Main TeamDesk client
 * Handles authentication and provides access to tables
 *
 * @example
 * ```typescript
 * const client = new TeamDeskClient({
 *   appId: 15331,
 *   token: 'your-api-token'
 * });
 *
 * const data = await client
 *   .table('Orders')
 *   .select()
 *   .execute();
 * ```
 */
export class TeamDeskClient {
  private config:
    & Required<
      Pick<TeamDeskConfig, "appId" | "baseUrl" | "debug">
    >
    & Pick<TeamDeskConfig, "token" | "user" | "password">
    & {
      cacheDir?: string;
    };

  constructor(config: TeamDeskConfig) {
    // Validate configuration
    if (!config.appId) {
      throw new Error("appId is required");
    }

    if (!config.token && !(config.user && config.password)) {
      throw new Error(
        "Either token or both user and password must be provided",
      );
    }

    // Set defaults
    // cacheDir defaults to "./_tdcache" unless explicitly set to null/false
    let cacheDir: string | undefined;
    if (config.cacheDir === null || config.cacheDir === false) {
      // Explicitly disabled
      cacheDir = undefined;
    } else if (config.cacheDir === undefined) {
      // Not specified, use default
      cacheDir = "./_tdcache";
    } else {
      // Custom path specified
      cacheDir = config.cacheDir;
    }

    this.config = {
      appId: String(config.appId),
      baseUrl: config.baseUrl || "https://www.teamdesk.net/secure/api/v2",
      debug: config.debug ?? false,
      token: config.token,
      user: config.user,
      password: config.password,
      cacheDir,
    };

    // Remove trailing slash from baseUrl
    this.config.baseUrl = this.config.baseUrl.replace(/\/$/, "");
  }

  /**
   * Get a table client for fluent query building
   *
   * @param tableName - Name of the table (will be URL-encoded automatically)
   * @returns TableClient instance for chaining
   *
   * @example
   * ```typescript
   * const orders = await client.table('Orders').select().execute();
   * ```
   */
  public table<T extends TeamDeskRecord = TeamDeskRecord>(
    tableName: string,
  ): TableClient<T> {
    return new TableClient<T>(this, tableName);
  }

  /**
   * Get database schema information
   * Lists all tables and their structures
   *
   * @returns Database schema with all tables
   *
   * @example
   * ```typescript
   * const schema = await client.describe();
   * console.log(schema.tables.map(t => t.recordsName));
   * ```
   */
  public async describe(): Promise<DatabaseSchema> {
    const url = this.buildUrl("/describe.json");
    return await this.request<DatabaseSchema>(url);
  }

  /**
   * Get the configured cache directory
   * Returns undefined if caching is disabled
   *
   * @returns Cache directory path or undefined if caching disabled
   */
  public getCacheDir(): string | undefined {
    return this.config.cacheDir;
  }

  /**
   * Build a complete API URL from a path
   * Handles authentication segment
   *
   * @internal
   */
  public buildUrl(path: string): string {
    const authSegment = this.config.token
      ? this.config.token
      : `${this.config.user}:${this.config.password}`;

    // Remove leading slash from path if present
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    return `${this.config.baseUrl}/${this.config.appId}/${authSegment}/${cleanPath}`;
  }

  /**
   * Execute an HTTP request with error handling
   *
   * @internal
   */
  public async request<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (this.config.debug) {
      console.log(`[TeDasuke] ${options.method || "GET"} ${url}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      // Handle different status codes
      if (!response.ok) {
        await this.handleErrorResponse(response, url);
      }

      // Parse response
      const data = await response.json();

      if (this.config.debug) {
        console.log(
          `[TeDasuke] Response:`,
          Array.isArray(data) ? `${data.length} records` : data,
        );
      }

      return data as T;
    } catch (error) {
      // Re-throw TeamDesk errors
      if (error instanceof TeamDeskError) {
        throw error;
      }

      // Wrap other errors
      throw new TeamDeskError(
        error instanceof Error ? error.message : "Unknown error",
        { url },
      );
    }
  }

  /**
   * Handle error responses from TeamDesk API
   *
   * @internal
   */
  private async handleErrorResponse(
    response: Response,
    url: string,
  ): Promise<never> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      try {
        // Try text if JSON parsing failed
        body = await response.text();
      } catch {
        body = `HTTP ${response.status} ${response.statusText}`;
      }
    }

    const { message, errors } = parseErrorResponse(body);

    // Map status codes to specific errors
    switch (response.status) {
      case 401:
      case 403:
        throw new AuthenticationError(
          `Authentication failed: ${message}`,
          { status: response.status, url },
        );

      case 404:
        throw new NotFoundError(
          `Resource not found: ${message}`,
          { url },
        );

      case 429: {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          `Rate limit exceeded: ${message}`,
          {
            retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
            url,
          },
        );
      }

      case 400:
      case 422:
        throw new ValidationError(
          `Validation failed: ${message}`,
          { status: response.status, details: errors, url },
        );

      default:
        if (response.status >= 500) {
          throw new ServerError(
            `Server error: ${message}`,
            { status: response.status, url },
          );
        }

        throw new TeamDeskError(
          `Request failed: ${message}`,
          { status: response.status, details: errors, url },
        );
    }
  }
}
