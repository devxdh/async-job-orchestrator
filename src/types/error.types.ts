export const ERROR_CODES = {
    AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
    FORBIDDEN_ACCESS: "FORBIDDEN_ACCESS",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    INVALID_JSON: "INVALID_JSON",
    INVALID_SESSION: "INVALID_SESSION",
    JOB_UPDATE_FAILED: "JOB_UPDATE_FAILED",
    USER_EXISTS: "USER_EXISTS",
    USER_NOT_FOUND: "USER_NOT_FOUND",
    VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type BodyParserError = {
    type?: string;
};

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type ErrorStatus = "fail" | "error";
export type ValidationFields = Record<string, string[] | undefined>;

export interface AppErrorOptions {
    code?: ErrorCode;
    fields?: ValidationFields;
}