/**
 * TeDasuke - Table client and query builders
 * Fluent interface for TeamDesk table operations
 */

import type {
  CreateResult,
  SelectOptions,
  TeamDeskRecord,
  UpdateResult,
  UpsertResult,
  WriteOptions,
} from "./types.ts";
import type { TeamDeskClient } from "./client.ts";
import {
  buildQueryString,
  encodeTableName,
  encodeViewName,
  formatSort,
  validatePaginationLimit,
} from "./utils.ts";

/**
 * Client for interacting with a specific TeamDesk table
 * Provides fluent interface for queries
 *
 * @template T - Type of records in this table
 */
export class TableClient<T extends TeamDeskRecord = TeamDeskRecord> {
  constructor(
    private client: TeamDeskClient,
    private tableName: string,
  ) {}

  /**
   * Start building a SELECT query
   * Returns a SelectBuilder for method chaining
   *
   * @param columns - Optional array of column names to select
   * @returns SelectBuilder instance
   *
   * @example
   * ```typescript
   * const orders = await client
   *   .table('Orders')
   *   .select(['OrderID', 'Total', 'CustomerName'])
   *   .execute();
   * ```
   */
  public select(columns?: string[]): SelectBuilder<T> {
    return new SelectBuilder<T>(this.client, this.tableName, columns);
  }

  /**
   * Access a view on this table
   * Returns a ViewClient for the specified view
   *
   * @param viewName - Name of the view
   * @returns ViewClient instance
   *
   * @example
   * ```typescript
   * const activeOrders = await client
   *   .table('Orders')
   *   .view('Active Orders')
   *   .select()
   *   .execute();
   * ```
   */
  public view(viewName: string): ViewClient<T> {
    return new ViewClient<T>(this.client, this.tableName, viewName);
  }

  /**
   * Create new records in this table
   *
   * @param records - Array of records to create
   * @param options - Write options (workflow, etc.)
   * @returns Array of create results
   *
   * @example
   * ```typescript
   * const results = await client
   *   .table('Clients')
   *   .create([
   *     { CompanyName: 'Acme Corp', Industry: 'Tech' }
   *   ]);
   * ```
   */
  public async create(
    records: Partial<T>[],
    options?: WriteOptions,
  ): Promise<CreateResult<T>[]> {
    const encodedTable = encodeTableName(this.tableName);
    const queryParams = buildQueryString({
      workflow: options?.workflow !== false ? 1 : 0,
    });
    const url = this.client.buildUrl(
      `${encodedTable}/create.json${queryParams}`,
    );

    const rawResults = await this.client.request<
      Array<{ status: number; id?: number; key?: string }>
    >(url, {
      method: "POST",
      body: JSON.stringify(records),
    });

    return rawResults.map((result) => ({
      success: result.status >= 200 && result.status < 300,
      status: result.status,
      data: {} as Partial<T>,
      id: result.id,
      key: result.key,
      errors: [],
    }));
  }

  /**
   * Update existing records in this table
   *
   * @param records - Array of records to update (must include key field)
   * @param options - Write options (workflow, etc.)
   * @returns Array of update results
   *
   * @example
   * ```typescript
   * const results = await client
   *   .table('Clients')
   *   .update([
   *     { key: 'ID123', Status: 'Active' }
   *   ]);
   * ```
   */
  public async update(
    records: Partial<T>[],
    options?: WriteOptions,
  ): Promise<UpdateResult<T>[]> {
    const encodedTable = encodeTableName(this.tableName);
    const queryParams = buildQueryString({
      workflow: options?.workflow !== false ? 1 : 0,
    });
    const url = this.client.buildUrl(
      `${encodedTable}/update.json${queryParams}`,
    );

    const rawResults = await this.client.request<
      Array<{ status: number; id?: number; key?: string }>
    >(url, {
      method: "POST",
      body: JSON.stringify(records),
    });

    return rawResults.map((result) => ({
      success: result.status >= 200 && result.status < 300,
      status: result.status,
      data: {} as Partial<T>,
      id: result.id,
      key: result.key,
      errors: [],
    }));
  }

  /**
   * Upsert records (create or update based on match column)
   *
   * @param records - Array of records to upsert
   * @param matchColumn - Column to match on for determining create vs update (optional, defaults to key column)
   * @param options - Write options (workflow, etc.)
   * @returns Array of upsert results
   *
   * @example
   * ```typescript
   * const results = await client
   *   .table('Contacts')
   *   .upsert(
   *     [{ Email: 'john@example.com', Name: 'John Doe' }],
   *     'Email'
   *   );
   * ```
   */
  public async upsert(
    records: Partial<T>[],
    matchColumn?: string,
    options?: WriteOptions,
  ): Promise<UpsertResult<T>[]> {
    const encodedTable = encodeTableName(this.tableName);
    const queryParams = buildQueryString({
      ...(matchColumn && { match: matchColumn }),
      workflow: options?.workflow !== false ? 1 : 0,
    });
    const url = this.client.buildUrl(
      `${encodedTable}/upsert.json${queryParams}`,
    );

    const rawResults = await this.client.request<
      Array<{ status: number; id?: number; key?: string }>
    >(url, {
      method: "POST",
      body: JSON.stringify(records),
    });

    return rawResults.map((result) => ({
      success: result.status >= 200 && result.status < 300,
      status: result.status,
      data: {} as Partial<T>,
      action: result.status === 201 ? "created" : "updated",
      id: result.id,
      key: result.key,
      errors: [],
    }));
  }
}

/**
 * Builder for SELECT queries with fluent interface
 * Supports filtering, sorting, pagination
 *
 * @template T - Type of records being selected
 */
export class SelectBuilder<T extends TeamDeskRecord = TeamDeskRecord> {
  private options: SelectOptions = {};

  constructor(
    private client: TeamDeskClient,
    private tableName: string,
    columns?: string[],
  ) {
    if (columns && columns.length > 0) {
      this.options.columns = columns;
    }
  }

  /**
   * Add a filter to the query
   *
   * @param filterExpression - TeamDesk formula language filter
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * const results = await client
   *   .table('Orders')
   *   .select()
   *   .filter('[Status]="Active" and [Total]>1000')
   *   .execute();
   * ```
   */
  public filter(filterExpression: string): this {
    this.options.filter = filterExpression;
    return this;
  }

  /**
   * Add sorting to the query
   *
   * @param column - Column to sort by
   * @param direction - Sort direction (ASC or DESC)
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * const results = await client
   *   .table('Orders')
   *   .select()
   *   .sort('OrderDate', 'DESC')
   *   .execute();
   * ```
   */
  public sort(column: string, direction: "ASC" | "DESC" = "ASC"): this {
    this.options.sortColumn = column;
    this.options.sortDirection = direction;
    return this;
  }

  /**
   * Set the maximum number of records to return
   * Maximum is 500 per TeamDesk API limits
   *
   * @param limit - Number of records (1-500)
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * const results = await client
   *   .table('Orders')
   *   .select()
   *   .limit(100)
   *   .execute();
   * ```
   */
  public limit(limit: number): this {
    this.options.top = validatePaginationLimit(limit);
    return this;
  }

  /**
   * Set the number of records to skip (for pagination)
   *
   * @param skip - Number of records to skip
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * const page2 = await client
   *   .table('Orders')
   *   .select()
   *   .skip(100)
   *   .limit(100)
   *   .execute();
   * ```
   */
  public skip(skip: number): this {
    if (skip < 0) {
      throw new Error("Skip must be non-negative");
    }
    this.options.skip = skip;
    return this;
  }

  /**
   * Execute the query and return results
   *
   * @returns Array of records matching the query
   *
   * @example
   * ```typescript
   * const results = await client
   *   .table('Orders')
   *   .select()
   *   .filter('[Status]="Active"')
   *   .execute();
   * ```
   */
  public async execute(): Promise<T[]> {
    const encodedTable = encodeTableName(this.tableName);
    const queryParams = this.buildQueryParams();
    const url = this.client.buildUrl(
      `${encodedTable}/select.json${queryParams}`,
    );

    return await this.client.request<T[]>(url);
  }

  /**
   * Execute the query and yield results in batches
   * Automatically handles pagination
   *
   * @yields Batches of records (up to 500 per batch)
   *
   * @example
   * ```typescript
   * for await (const batch of client.table('Orders').select().selectAll()) {
   *   console.log(`Processing ${batch.length} orders`);
   * }
   * ```
   */
  public async *selectAll(): AsyncGenerator<T[], void, unknown> {
    const batchSize = 500;
    let offset = this.options.skip || 0;

    while (true) {
      // Create a new builder with current options plus pagination
      const builder = new SelectBuilder<T>(
        this.client,
        this.tableName,
        this.options.columns,
      );
      builder.options = { ...this.options, skip: offset, top: batchSize };

      const batch = await builder.execute();

      if (batch.length === 0) {
        break;
      }

      yield batch;

      if (batch.length < batchSize) {
        // Last batch was partial, we're done
        break;
      }

      offset += batchSize;
    }
  }

  /**
   * Build query parameters from options
   * @internal
   */
  private buildQueryParams(): string {
    const params: Record<string, string | number | string[]> = {};

    if (this.options.columns && this.options.columns.length > 0) {
      params.column = this.options.columns;
    }

    if (this.options.filter) {
      params.filter = this.options.filter;
    }

    if (this.options.sortColumn) {
      params.sort = formatSort(
        this.options.sortColumn,
        this.options.sortDirection || "ASC",
      );
    }

    if (this.options.top !== undefined) {
      params.top = this.options.top;
    }

    if (this.options.skip !== undefined) {
      params.skip = this.options.skip;
    }

    return buildQueryString(params);
  }
}

/**
 * Client for accessing a specific view on a table
 * Views are pre-configured queries in TeamDesk UI
 *
 * @template T - Type of records in this view
 */
export class ViewClient<T extends TeamDeskRecord = TeamDeskRecord> {
  constructor(
    private client: TeamDeskClient,
    private tableName: string,
    private viewName: string,
  ) {}

  /**
   * Start building a SELECT query on this view
   * Views already have filters/sorting configured, but you can add more
   *
   * @param columns - Optional array of column names to select
   * @returns ViewSelectBuilder instance
   *
   * @example
   * ```typescript
   * const data = await client
   *   .table('Orders')
   *   .view('Active Orders')
   *   .select()
   *   .execute();
   * ```
   */
  public select(columns?: string[]): ViewSelectBuilder<T> {
    return new ViewSelectBuilder<T>(
      this.client,
      this.tableName,
      this.viewName,
      columns,
    );
  }
}

/**
 * Builder for SELECT queries on views
 * Similar to SelectBuilder but uses view endpoint
 *
 * @template T - Type of records being selected
 */
export class ViewSelectBuilder<T extends TeamDeskRecord = TeamDeskRecord> {
  private options: SelectOptions = {};

  constructor(
    private client: TeamDeskClient,
    private tableName: string,
    private viewName: string,
    columns?: string[],
  ) {
    if (columns && columns.length > 0) {
      this.options.columns = columns;
    }
  }

  /**
   * Set the maximum number of records to return
   *
   * @param limit - Number of records (1-500)
   * @returns this (for chaining)
   */
  public limit(limit: number): this {
    this.options.top = validatePaginationLimit(limit);
    return this;
  }

  /**
   * Set the number of records to skip (for pagination)
   *
   * @param skip - Number of records to skip
   * @returns this (for chaining)
   */
  public skip(skip: number): this {
    if (skip < 0) {
      throw new Error("Skip must be non-negative");
    }
    this.options.skip = skip;
    return this;
  }

  /**
   * Execute the query and return results
   *
   * @returns Array of records from the view
   */
  public async execute(): Promise<T[]> {
    const encodedTable = encodeTableName(this.tableName);
    const encodedView = encodeViewName(this.viewName);
    const queryParams = this.buildQueryParams();
    const url = this.client.buildUrl(
      `${encodedTable}/${encodedView}/select.json${queryParams}`,
    );

    return await this.client.request<T[]>(url);
  }

  /**
   * Execute the query and yield results in batches
   * Automatically handles pagination
   *
   * @yields Batches of records (up to 500 per batch)
   */
  public async *selectAll(): AsyncGenerator<T[], void, unknown> {
    const batchSize = 500;
    let offset = this.options.skip || 0;

    while (true) {
      const builder = new ViewSelectBuilder<T>(
        this.client,
        this.tableName,
        this.viewName,
        this.options.columns,
      );
      builder.options = { ...this.options, skip: offset, top: batchSize };

      const batch = await builder.execute();

      if (batch.length === 0) {
        break;
      }

      yield batch;

      if (batch.length < batchSize) {
        break;
      }

      offset += batchSize;
    }
  }

  /**
   * Build query parameters from options
   * @internal
   */
  private buildQueryParams(): string {
    const params: Record<string, string | number | string[]> = {};

    if (this.options.columns && this.options.columns.length > 0) {
      params.column = this.options.columns;
    }

    if (this.options.top !== undefined) {
      params.top = this.options.top;
    }

    if (this.options.skip !== undefined) {
      params.skip = this.options.skip;
    }

    return buildQueryString(params);
  }
}
