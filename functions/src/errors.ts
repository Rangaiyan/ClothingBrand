// Domain error raised by pure logic; entrypoints map it to an HttpsError.
export type OrderErrorCode =
  | "invalid-argument"
  | "failed-precondition"
  | "not-found"
  | "resource-exhausted";

export class OrderError extends Error {
  constructor(
    public code: OrderErrorCode,
    message: string,
  ) {
    super(message);
  }
}
