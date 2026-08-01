/**
 * Raised when a promise does not settle before the async timeout expires.
 */
export class AsyncTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`timed out after ${timeoutMs}ms`);
    this.name = "AsyncTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Races a promise against a timeout so an async assertion can never
 * hang forever when student code never settles its promise.
 *
 * The timer is cleared as soon as the promise settles, and a no-op
 * rejection handler is attached to the original promise so a late
 * rejection (after the timeout has already fired) cannot surface as
 * an unhandled promise rejection.
 *
 * @param {Promise} promise    - The promise being awaited.
 * @param {number}  timeoutMs  - Maximum time to wait, in milliseconds.
 * @returns {Promise} Resolves with the awaited value or rejects with
 *                     AsyncTimeoutError when the timeout expires first.
 */
export function withTimeout(promise, timeoutMs) {
  let timerId = null;

  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new AsyncTimeoutError(timeoutMs));
    }, timeoutMs);
  });

  const raced = Promise.race([promise, timeout]);

  const clearTimer = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  raced.then(clearTimer, clearTimer);

  return raced;
}
