export class ApiClientError extends Error {
  status: number;
  code?: string;
  remaining?: number;
  /** Counter feature that ran out, e.g. "mentor_messages". Sent with QUOTA_LIMIT. */
  feature?: string;
  /** Tier that lifts this limit — lets a paywall say "Pro" vs "Exam Pass". */
  upgradeTier?: string;

  constructor(
    message: string,
    status: number,
    extra?: {
      code?: string;
      remaining?: number;
      feature?: string;
      upgradeTier?: string;
    },
  ) {
    super(message);
    this.status = status;
    this.code = extra?.code;
    this.remaining = extra?.remaining;
    this.feature = extra?.feature;
    this.upgradeTier = extra?.upgradeTier;
  }
}

/** True when the backend rejected the request for lack of a valid session. */
export function isUnauthorizedError(err: unknown): boolean {
  return err instanceof ApiClientError && err.status === 401;
}
