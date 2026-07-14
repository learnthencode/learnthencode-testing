import { createResult } from "../core/results.js";


/**
 * Creates an assertion result.
 *
 * @param {object} options
 * @returns {object}
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

    earned:
      condition
        ? requirement.points ?? 0
        : 0,

    message:
      condition
        ? ""
        : message,

    hint:
      condition
        ? ""
        : requirement.hint ?? "",
  });
}