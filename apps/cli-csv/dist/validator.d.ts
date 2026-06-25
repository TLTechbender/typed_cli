import type { ValidationResult, FieldRules, ValidatedRecord, RowValidationError, CsvRow, ValidationSchema } from "@typed_cli/shared";
export declare const validateNumber: (input: string | number, rules: FieldRules) => ValidationResult;
export declare const validateEmail: (input: string, rules: FieldRules) => ValidationResult;
export declare const validateString: (input: string, rules: FieldRules) => ValidationResult;
export declare const validateRow: (row: CsvRow, schema: ValidationSchema, rowNumber: number) => {
    valid: true;
    record: ValidatedRecord;
} | {
    valid: false;
    errors: RowValidationError[];
};
//# sourceMappingURL=validator.d.ts.map