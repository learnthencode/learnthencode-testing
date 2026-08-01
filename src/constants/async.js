/**
 * Default maximum time an asynchronous assertion waits for a promise
 * to settle before failing with a timeout.
 *
 * Kept in a dedicated constants module so future framework versions
 * can adjust the default without changing any assertion schema.
 */
export const ASYNC_TIMEOUT_MS = 3000;

/**
 * Builds the learner-friendly timeout failure message.
 *
 * @param {string} name      - The function being tested.
 * @param {number} timeoutMs - The timeout that was applied.
 * @returns {string}
 */
export function formatTimeoutMessage(name, timeoutMs) {
  return (
    `Function "${name}" did not settle within ${timeoutMs}ms. ` +
    `Make sure it returns a Promise that resolves or rejects.`
  );
}
