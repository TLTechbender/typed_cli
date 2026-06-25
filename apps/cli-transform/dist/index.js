import * as fs from "fs";
import * as path from "path";
async function main() {
    console.log("Reading output.json...");
    const outputPath = path.join(process.cwd(), "data", "output.json");
    if (!fs.existsSync(outputPath)) {
        console.error(`Error: ${outputPath} not found!`);
        console.error("Run cli-csv first: node apps/cli-csv/dist/index.js < data/input.csv");
        process.exit(1);
    }
    const jsonText = fs.readFileSync(outputPath, "utf-8");
    console.log("✓ File read successfully");
    const data = JSON.parse(jsonText);
    const isMapFlagPresent = Boolean(process.argv.indexOf("--map"));
    if (!isMapFlagPresent) {
        console.log("To transform the JSON please ensure to include the --map flag");
    }
    const mapCommands = process.argv[process.argv.indexOf("--map") + 1];
    if (!mapCommands) {
        console.log("You have to specify at least one map using the format: oldName:newName");
    }
    const commands = mapCommands.split(",");
    commands.map((command) => {
        const [oldValue, newValue] = command.split(":");
        const dataToModify = data.data;
        dataToModify.map((dataItem) => {
            if (oldValue in dataItem) {
                dataItem[newValue] = dataItem[oldValue];
                delete dataItem[oldValue];
            }
        });
    });
    console.log("Writing transformed data...");
    const transformedPath = path.join(process.cwd(), "data", "transformed.json");
    fs.writeFileSync(transformedPath, JSON.stringify(data, null, 2));
    console.log(`Written to ${transformedPath}`);
}
main().catch(console.error);
//# sourceMappingURL=index.js.map