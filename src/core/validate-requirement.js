/**
 * Validates a single requirement object from requirements.json.
 *
 * Required fields: name, points, check.
 * - `points` must be a number (supports fractional values).
 * - `check`  must be an object defining the assertion to run.
 *
 * @param {object} requirement - The requirement object to validate.
 * @throws {Error} If a required field is missing or has the wrong type.
 */
export function validateRequirement(requirement) {

  // Fields every requirement must declare
  const requiredFields = [
    "name",
    "points",
    "check",
  ];

  for (const field of requiredFields) {

    if (!(field in requirement)) {

      throw new Error(
        `Invalid requirement. Missing required property: "${field}".`
      );

    }

  }

  // points must be numeric so it can be summed into the final score
  if (typeof requirement.points !== "number") {

    throw new Error(
      `"points" must be a number.`
    );

  }

  // check must be an object so we can read check.type, check.selector, etc.
  if (typeof requirement.check !== "object") {

    throw new Error(
      `"check" must be an object.`
    );

  }

}