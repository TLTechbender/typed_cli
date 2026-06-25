# TypedCLI — CSV Validation & Transformation Monorepo

## What Is This?

TypedCLI is a command-line tool that parses CSV files, validates them against a schema, and transforms field names. Sounds simple right? Because it is. But I decided to overcomplicate it on purpose to learn how pnpm workspaces actually work.

The original goal: **Explore pnpm monorepos with a real project**. Could've done this in one folder and been done in record time. Instead, I split it into three packages, set up TypeScript everywhere, and learned some painful lessons about configuration. Story of my life.

## What It Does

```bash
# Parse & validate CSV
node apps/cli-csv/dist/index.js < data/input.csv

# Transform field names
node apps/cli-transform/dist/index.js --map 'name:fullName,age:years'
```

**The Flow:**

1. **cli-csv** reads CSV → parses it → validates against schema → outputs JSON to `data/output.json`
2. **cli-transform** reads `data/output.json` → applies field mappings → outputs transformed JSON

That's it. No piping (learned the hard way that `tsx` and `pnpm` have weird things going on with stdin). Just file-based handoffs.

## The Overcomplicated Architecture

Why three packages when you could do one?

```
my-cli-project/
├── packages/
│   └── shared/           # Types only (CsvRow, ValidationResult, etc.)
├── apps/
│   ├── cli-csv/         # Parser + validator
│   └── cli-transform/   # Field mapper
└── docker-compose.yml
```

**Why I Did This:**

- Learn how monorepos actually work
- Practice TypeScript path resolution and workspace linking
- Understand the real pain points before using Turborepo or Nx

**Was it worth it?** Honestly, no. For this use case, one folder would've been fine. But the learning was real.

## The Pain Points (Real Talk)

### 1. TypeScript Config Hell

This one destroyed me. The root `tsconfig.json` shouldn't compile anything in a monorepo, but TypeScript didn't know that:

```json
// ❌ WRONG (root tsconfig with include/exclude)
{
  "compilerOptions": { ... },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Result: `Cannot find module at rootDir` errors everywhere.

**Fix:** Root tsconfig has NO `include`, `exclude`, `outDir`, or `rootDir`. Each package defines its own:

```json
// ✓ RIGHT (root tsconfig - base config only)
{
  "compilerOptions": {
    "lib": ["es2024"],
    "module": "nodenext",
    "target": "es2024",
    "strict": true
    // ... no include/exclude/outDir/rootDir
  }
}
```

Then each package extends it. Sounds obvious in hindsight, but TypeScript's error messages were useless.

### 2. The Mysterious `lib` Array Issue

Every time I tried to compile cli-transform, TypeScript said:

```
Cannot find name 'console'. Do you need to change your target library?
Try changing the 'lib' compiler option to include 'dom'.
```

I had:

```json
"lib": [
  "es2024",
  "ESNext.Array",
  "ESNext.Collection",
  ...
]
```

Turns out that granular approach was to write a new tsconfig file for cli-transform, Walahi, I still don't know why though

### 3. stdin Piping with `tsx watch`

Tried to pipe CSV data with:

```bash
cat data.csv | pnpm --filter cli-csv run dev
```

Nothing worked. Data never reached the app. Spent 2 hours debugging before realizing: **`tsx` hijacks stdin for file watching**.

**Solution:** Don't use `tsx watch` for CLI tools that need stdin. Either:

- Build and run compiled JS: `pnpm build && node dist/index.js < data.csv`
- Use a separate watch script without piping

### 4. pnpm Workspace Symlinks

At first I didn't understand why importing worked:

```typescript
import { CsvRow } from "@typed_cli/shared"; // This actually works?
```

It's because pnpm creates symlinks in `node_modules`. So `@typed_cli/shared` is literally just a link to `packages/shared/`. Mind = blown.

## Project Structure

```
typed_cli/
├── pnpm-workspace.yaml          # Tells pnpm about packages
├── package.json                 # Root (private, for tools)
├── tsconfig.json                # Base TypeScript config
├── Dockerfile                   # Multi-stage build
├── docker-compose.yml           # Run in containers
│
├── packages/shared/
│   ├── package.json
│   ├── tsconfig.json           # Extends root
│   └── src/index.ts            # All type definitions
│
├── apps/cli-csv/
│   ├── package.json
│   ├── tsconfig.json           # Extends root
│   └── src/
│       ├── index.ts            # Main entry
│       ├── parser.ts           # CSV parsing (csv-parse library)
│       ├── validator.ts        # Validation logic
│       └── schema.ts           # User-defined schema
│
├── apps/cli-transform/
│   ├── package.json
│   ├── tsconfig.json           # Extends root
│   └── src/index.ts            # Field transformation
│
└── data/
    └── input.csv               # Test data
```

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

This installs for all packages and creates symlinks.

### 2. Build Everything

```bash
pnpm --filter @typed_cli/shared build
pnpm --filter cli-csv build
pnpm --filter cli-transform build
```

Or in one line:

```bash
pnpm --filter @typed_cli/shared build && pnpm --filter cli-csv build && pnpm --filter cli-transform build
```

### 3. Create Your Schema

**File: `apps/cli-csv/src/schema.ts`**

```typescript
import type { ValidationSchema } from "@typed_cli/shared";

export const schema: ValidationSchema = {
  fields: {
    name: { type: "string", required: true },
    age: { type: "number", required: true, min: 0, max: 150 },
    email: { type: "email", required: true },
    grade: { type: "string", required: false },
  },
};
```

### 4. Prepare Your CSV

# Keep in mind your schema must be in line with the csv sha, otherwise una go too pack errors

**File: `data/input.csv`**

```
name,age,email,grade
John Doe,20,john.doe@example.com,A
Jane Smith,25,jane.smith@example.com,B
```

## How to Run It

### Parse & Validate CSV

```bash
node apps/cli-csv/dist/index.js < data/input.csv
```

Output: `data/output.json` with validated records and errors.

### Transform Field Names

```bash
node apps/cli-transform/dist/index.js --map 'name:fullName,age:years'
```

Output: Transformed JSON to stdout.

### Full Workflow

```bash
node apps/cli-csv/dist/index.js < data/input.csv && \
node apps/cli-transform/dist/index.js --map 'name:fullName,age:years'
```

## Docker

Got tired after building and thought: _"Why not use this as my Docker capstone?"_ from my intro to docker course on KodeKloud that I just recently ran through

So I Dockerized it. Multi-stage build: builder stage compiles everything, runtime stage is clean and small.

```bash
# Build image
docker build -t typed-cli .

# Run
docker run -v $(pwd)/data:/app/data typed-cli
```

Or with docker-compose:

```bash
docker-compose up --build
```

**Caveat:** Haven't actually tested this yet. My 1.5gb no fit pull images atm. Will test when I renew my subscription lol. But the Dockerfile looks correct in theory.

## What I Learned

### The Good

- How pnpm workspace symlinks work
- Multi-stage Docker builds actually reduce image size significantly
- TypeScript becomes manageable when you understand config inheritance
- Monorepos have real benefits for shared types, but overkill for simple projects
- pnpm smartness with caching reusing node_modules and not having to always reach out to npm registry to install new stuff

### The Bad

- TypeScript's error messages for config issues are absolutely useless
- `tsx watch` breaks CLI tools that need stdin
- Granular `lib` arrays are more trouble than they're worth
- Monorepos add complexity that simple projects don't need

### The Ugly

- Spent 4 hours on TypeScript config that could've been 20 minutes
- Created 3 packages when 1 would've sufficed
- Ran into stdin piping issues that didn't exist before
- Docker testing blocked by internet limitations

## Future Ideas

- Actually test Docker when internet renews
- Config file support instead of hardcoded schema

## Bottom Line

This project taught me that **tools exist for a reason**.
Would I do this again? Nah. But I understand monorepos way better now, and that's worth it.

---

## Tech Stack

- **Language:** TypeScript
- **Package Manager:** pnpm (monorepo aware)
- **CSV Parsing:** csv-parse
- **Validation:** Custom validators
- **Runtime:** Node.js 22
- **Docker:** Multi-stage build

## License

Vibes and Insha allah

---

_Built while learning pnpm workspaces. Overcomplicated on purpose. Learned a lot. Would not recommend._
