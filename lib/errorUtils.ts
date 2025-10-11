/**
 * Centralized error handling utilities
 */

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class AppError extends Error {
  public code?: string;
  public status?: number;
  public details?: any;

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function handleError(error: unknown, context?: string): AppError {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, { originalError: error.message });
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500, { originalError: error });
}

export function createErrorResponse(error: AppError) {
  return {
    error: error.message,
    code: error.code,
    status: error.status,
    details: error.details,
  };
}

export function logError(error: AppError, context?: string): void {
  const logData = {
    message: error.message,
    code: error.code,
    status: error.status,
    context,
    timestamp: new Date().toISOString(),
    details: error.details,
  };

  console.error('Application Error:', logData);
}
