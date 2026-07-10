export class ApiClientError extends Error {
  status: number;
  code?: string;
  remaining?: number;

  constructor(
    message: string,
    status: number,
    extra?: { code?: string; remaining?: number },
  ) {
    super(message);
    this.status = status;
    this.code = extra?.code;
    this.remaining = extra?.remaining;
  }
}

/** True when the backend rejected the request for lack of a valid session. */
export function isUnauthorizedError(err: unknown): boolean {
  return err instanceof ApiClientError && err.status === 401;
}
