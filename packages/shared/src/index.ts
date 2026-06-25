export interface CsvRow {
  [key: string]: string;
}

export interface ValidatedRecord {
  [key: string]: unknown;
}

export interface FieldRules {
  type: "string" | "number" | "email" | "boolean" | "date";
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: unknown[];
  custom?: (value: unknown) => boolean;
}

export interface ValidationSchema {
  fields: {
    [fieldName: string]: FieldRules;
  };
}

export interface ValidationResult {
  success: boolean;
  value?: unknown;
  error?: string;
}

export interface RowValidationError {
  rowNumber: number;
  field: string;
  reason: string;
}

export interface CsvParseResult {
  data: ValidatedRecord[];
  errors: RowValidationError[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

export interface FieldMapping {
  [oldFieldName: string]: string;
}

export interface TransformResult {
  transformed: ValidatedRecord[];
  failedRecords?: {
    rowNumber: number;
    reason: string;
  }[];
}

export interface TypedValidationResult<T> {
  success: boolean;
  value?: T;
  error?: string;
}

export interface CliResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type ProgressCallback = (stage: string, message: string) => void;
