export abstract class AppError extends Error {
  constructor(
    public readonly name: string,
    public readonly statusCode: number,
    public readonly message: string,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('ValidationError', 400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Not authenticated') {
    super('AuthenticationError', 401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized to perform this action') {
    super('AuthorizationError', 403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NotFoundError', 404, `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('ConflictError', 409, message);
  }
}

export class WorkflowError extends AppError {
  constructor(message: string) {
    super('WorkflowError', 422, message);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super('DatabaseError', 500, message, false);
  }
}
