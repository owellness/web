export type ApplicationErrorCode =
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "INTERNAL";

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export const notFound = (resource: string) =>
  new ApplicationError("NOT_FOUND", `${resource} not found`);

export const forbidden = (reason = "Forbidden") =>
  new ApplicationError("FORBIDDEN", reason);

export const unauthorized = (reason = "Unauthorized") =>
  new ApplicationError("UNAUTHORIZED", reason);

export const validationFailed = (reason: string) =>
  new ApplicationError("VALIDATION_FAILED", reason);
