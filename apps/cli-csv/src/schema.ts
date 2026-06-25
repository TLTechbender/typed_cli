import type { ValidationSchema } from "@typed_cli/shared";

export const schema: ValidationSchema = {
  fields: {
    name: { type: "string", required: true, min: 1 },
    age: { type: "number", required: true, min: 0, max: 150 },
    email: { type: "email", required: true },
    grade: { type: "string", required: false },
  },
};
