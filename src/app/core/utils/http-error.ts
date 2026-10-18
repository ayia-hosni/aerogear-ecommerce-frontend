import { HttpErrorResponse } from '@angular/common/http';

interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export function describeHttpError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Something went wrong. Please try again.';
  }

  if (error.status === 0) {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  const problem = error.error as ProblemDetails | null;
  const validation = problem?.errors ? Object.values(problem.errors).flat() : [];

  return validation[0] ?? problem?.detail ?? problem?.title ?? 'Something went wrong. Please try again.';
}
