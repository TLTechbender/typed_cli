import { parseCSV } from "./parser.js";
import { validateRow } from "./validator.js";
import { schema } from "./schema.js";
import * as fs from "fs";
import * as path from "path";
async function main() {
    console.log("Waiting for CSV data...");
    const csvText = await readStdin();
    console.log("CSV received");
    const parsedRows = parseCSV(csvText);
    console.log(" Validating rows...");
    const validRecords = [];
    const errors = [];
    for (let i = 0; i < parsedRows.length; i++) {
        const result = validateRow(parsedRows[i], schema, i + 2);
        if (result.valid) {
            validRecords.push(result.record);
        }
        else {
            errors.push(...result.errors);
        }
    }
    const csvResult = {
        data: validRecords,
        errors,
        summary: {
            totalRows: parsedRows.length,
            validRows: validRecords.length,
            invalidRows: errors.length,
        },
    };
    console.log(" Writing output...");
    const outputPath = path.join(process.cwd(), "data", "output.json");
    fs.writeFileSync(outputPath, JSON.stringify(csvResult, null, 2));
    console.log(`✓ Written to ${outputPath}`);
}
main().catch(console.error);
async function readStdin() {
    return new Promise((resolve) => {
        let data = "";
        process.stdin.on("data", (chunk) => (data += chunk));
        process.stdin.on("end", () => resolve(data));
    });
}
