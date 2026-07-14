/**
 * Creates a test result object.
 *
 * @param {object} data
 * @returns {object}
 */
export function createResult({
  name,
  passed,
  message = "",
  hint = "",
}) {
  return {
    name,
    passed,
    message,
    hint,
  };
}

/**
 * Creates a test result collection.
 *
 * @returns {object}
 */
export function createResultCollection() {
  return {
    results: [],

    add(result) {
      this.results.push(result);
    },

    summary() {
      const total = this.results.length;

      const passed = this.results.filter(
        (result) => result.passed
      ).length;

      return {
        total,
        passed,
        failed: total - passed,
      };
    },
  };
}