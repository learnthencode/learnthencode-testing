import { createResult } from "../core/results.js";


/**
 * Wraps an assertion condition into a structured result object.
 *
 * This is the single bridge between every assertion function and the
 * result data model. It enforces the rule that:
 *   - Points are only earned when the condition is true.
 *   - The failure message and hint are suppressed on a passing result.
 *
 * @param {object}  options
 * @param {object}  options.requirement - The requirement being evaluated.
 * @param {boolean} options.condition   - True if the assertion passed.
 * @param {string}  [options.message=""] - Human-readable failure reason.
 * @returns {object} A result object (see createResult).
 */
export function expect({
  requirement,
  condition,
  message = "",
}) {
  return createResult({
    id: requirement.id,

    name: requirement.name,

    description:
      requirement.description,

    passed: condition,

    points:
      requirement.points ?? 0,

    // Award full points on pass; zero on failure
    earned:
      condition
        ? requirement.points ?? 0
        : 0,

    // Suppress the message on a pass to keep output clean
    message:
      condition
        ? ""
        : message,

    // Only surface the hint when the learner needs it (i.e. on failure)
    hint:
      condition
        ? ""
        : requirement.hint ?? "",
  });
}