/**
 * Creates a test result object.
 *
 * @param {object} data
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


      const failed = total - passed;


      const points = this.results.reduce(
        (sum, result) =>
          sum + result.points,
        0
      );


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