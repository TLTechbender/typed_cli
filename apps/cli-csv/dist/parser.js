import { parse } from "csv-parse/sync";
export function parseCSV(csvText) {
    const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        relax_column_count_less: true,
    });
    return records;
}
