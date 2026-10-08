export interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

export interface ValidationErrorDetail {
  path: PropertyKey[];
  message: string;
  code: string;
}
