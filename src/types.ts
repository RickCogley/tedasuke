/**
 * TeDasuke - TypeScript type definitions
 * Types for TeamDesk/DBFlex REST API
 */

/**
 * Configuration options for TeamDeskClient
 */
export interface TeamDeskConfig {
  /** TeamDesk application ID (can be number or string) */
  appId: string | number;
  /** API token for authentication (preferred) */
  token?: string;
  /** Username for basic auth (alternative to token) */
  user?: string;
  /** Password for basic auth (alternative to token) */
  password?: string;
  /** Base URL for the API (defaults to https://www.teamdesk.net/secure/api/v2 or https://pro.dbflex.net/secure/api/v2) */
  baseUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Base response from TeamDesk API
 * All records include special @row.* properties
 */
export interface TeamDeskRecord {
  /** Internal row ID */
  "@row.id": number;
  /** Permissions for this row (e.g., "Edit, Delete") */
  "@row.allow"?: string;
  /** Any other properties from the table */
  [key: string]: unknown;
}

/**
 * Error returned from TeamDesk API
 */
export interface ApiError {
  /** Column name where error occurred (optional) */
  column?: string;
  /** Error message */
  message: string;
}

/**
 * Result from create operation
 */
export interface CreateResult<T = Record<string, unknown>> {
  /** Whether the operation succeeded */
  success: boolean;
  /** HTTP status code */
  status: number;
  /** The created record data */
  data: Partial<T>;
  /** Row ID of created record */
  id?: number;
  /** Key value of created record */
  key?: string;
  /** Any errors that occurred */
  errors: ApiError[];
}

/**
 * Result from update operation
 */
export interface UpdateResult<T = Record<string, unknown>> {
  /** Whether the operation succeeded */
  success: boolean;
  /** HTTP status code */
  status: number;
  /** The updated record data */
  data: Partial<T>;
  /** Row ID of updated record */
  id?: number;
  /** Key value of updated record */
  key?: string;
  /** Any errors that occurred */
  errors: ApiError[];
}

/**
 * Result from upsert operation
 */
export interface UpsertResult<T = Record<string, unknown>> {
  /** Whether the operation succeeded */
  success: boolean;
  /** HTTP status code */
  status: number;
  /** The upserted record data */
  data: Partial<T>;
  /** Whether record was created or updated */
  action: "created" | "updated";
  /** Row ID of upserted record */
  id?: number;
  /** Key value of upserted record */
  key?: string;
  /** Any errors that occurred */
  errors: ApiError[];
}

/**
 * Result from delete operation
 */
export interface DeleteResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** HTTP status code */
  status: number;
  /** Key of deleted record */
  key?: string;
  /** Any errors that occurred */
  errors: ApiError[];
}

/**
 * Table schema information from describe endpoint
 */
export interface TableSchema {
  /** Internal table name */
  name: string;
  /** Display name for records */
  recordsName: string;
  /** Display name for single record */
  recordName: string;
  /** Array of column schemas */
  columns: ColumnSchema[];
}

/**
 * Column schema information
 */
export interface ColumnSchema {
  /** Column name */
  name: string;
  /** Column type (e.g., "Text", "Number", "Date", "Checkbox") */
  type: string;
  /** Whether column is required */
  required?: boolean;
  /** Whether column is unique */
  unique?: boolean;
  /** Maximum length for text columns */
  maxLength?: number;
}

/**
 * Database schema information from describe endpoint
 */
export interface DatabaseSchema {
  /** Array of table schemas */
  tables: TableSchema[];
}

/**
 * Options for select queries
 */
export interface SelectOptions {
  /** Columns to select (if not specified, all columns) */
  columns?: string[];
  /** Filter expression in TeamDesk formula language */
  filter?: string;
  /** Column to sort by */
  sortColumn?: string;
  /** Sort direction */
  sortDirection?: "ASC" | "DESC";
  /** Number of records to skip (for pagination) */
  skip?: number;
  /** Maximum number of records to return (max 500) */
  top?: number;
}

/**
 * Options for write operations (create, update, upsert, delete)
 */
export interface WriteOptions {
  /** Whether to trigger workflow rules (default: true) */
  workflow?: boolean;
}

/**
 * Options for delete operations
 */
export interface DeleteOptions extends WriteOptions {
  /** Whether to purge the record permanently (default: false) */
  purge?: boolean;
}
