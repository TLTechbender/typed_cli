export const validateNumber = (input, rules) => {
    const value = typeof input === "string" ? Number(input) : input;
    if (Number.isNaN(value)) {
        return {
            success: false,
            error: "Must be a valid number",
        };
    }
    if (rules.min !== undefined && value < rules.min) {
        return {
            success: false,
            error: `Must be at least ${rules.min}`,
        };
    }
    if (rules.max !== undefined && value > rules.max) {
        return {
            success: false,
            error: `Must be at most ${rules.max}`,
        };
    }
    return {
        success: true,
        value,
    };
};
export const validateEmail = (input, rules) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input)) {
        return {
            success: false,
            error: "Must be a valid email",
        };
    }
    return {
        success: true,
        value: input,
    };
};
export const validateString = (input, rules) => {
    if (rules.min !== undefined && input.length < rules.min) {
        return {
            success: false,
            error: `Must be at least ${rules.min} characters`,
        };
    }
    if (rules.max !== undefined && input.length > rules.max) {
        return {
            success: false,
            error: `Must be at most ${rules.max} characters`,
        };
    }
    if (rules.pattern) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(input)) {
            return {
                success: false,
                error: `Must match pattern: ${rules.pattern}`,
            };
        }
    }
    return {
        success: true,
        value: input,
    };
};
export const validateRow = (row, schema, rowNumber) => {
    const errors = [];
    const record = {};
    for (const [fieldName, rules] of Object.entries(schema.fields)) {
        const rawValue = row[fieldName];
        if (rules.required && !rawValue) {
            errors.push({
                rowNumber,
                field: fieldName,
                reason: `${fieldName} is required`,
            });
            continue;
        }
        if (!rules.required && !rawValue) {
            continue;
        }
        let result;
        switch (rules.type) {
            case "number":
                result = validateNumber(rawValue, rules);
                break;
            case "email":
                result = validateEmail(rawValue, rules);
                break;
            case "string":
            default:
                result = validateString(rawValue, rules);
        }
        if (!result.success) {
            errors.push({
                rowNumber,
                field: fieldName,
                reason: result.error || "Validation failed",
            });
            continue;
        }
        record[fieldName] = result.value;
    }
    if (errors.length > 0) {
        return { valid: false, errors };
    }
    return { valid: true, record };
};
