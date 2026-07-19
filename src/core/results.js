/**
 * Creates an immutable test result object for a single requirement.
 *
 * @param {object} data
 * @param {string} data.id          - Unique requirement identifier.
 * @param {string} data.name        - Human-readable requirement label.
 * @param {string} [data.description=""] - Optional longer description.
 * @param {boolean} data.passed     - Whether the assertion passed.
 * @param {number} [data.points=0]  - Total points available for this requirement.
 * @param {number} [data.earned=0]  - Points actually earned (0 if failed).
 * @param {string} [data.message=""] - Failure message (empty on pass).
 * @param {string} [data.hint=""]   - Optional hint shown to the learner on failure.
 * @returns {object}
 */
export function createResult({
  id,
  name,
  description = "",
  passed,
  points = 0,
  earned = 0,
  message = "",
  hint = "",
}) {
  return {
    id,
    name,
    description,

    passed,

    points,
    earned,

    message,
    hint,
  };
}


/**
 * Creates a mutable collection of test results that accumulates
 * individual results and can compute an aggregate summary.
 *
 * @returns {object} An object with `results`, `add()`, and `summary()`.
 */
export function createResultCollection() {
  return {
    /** @type {object[]} Accumulated result objects */
    results: [],


    /**
     * Appends a result to the collection.
     *
     * @param {object} result - A result object produced by createResult().
     */
    add(result) {
      this.results.push(result);
    },


    /**
     * Computes aggregate statistics across all collected results.
     *
     * @returns {{ total: number, passed: number, failed: number, points: number, earned: number, percentage: number }}
     */
    summary() {
      const total = this.results.length;

      // Count results that passed
      const passed = this.results.filter(
        (result) => result.passed
      ).length;

      const failed = total - passed;

      // Sum total available points across all requirements
      const points = this.results.reduce(
        (sum, result) =>
          sum + result.points,
        0
      );

      // Sum points actually earned (only from passing results)
      const earned = this.results.reduce(
        (sum, result) =>
          sum + result.earned,
        0
      );

      return {
        total,
        passed,
        failed,

        points,
        earned,

        // Guard against division by zero when no points are defined
        percentage:
          points === 0
            ? 0
            : Math.round(
                (earned / points) * 100
              ),
      };
    },
  };
}