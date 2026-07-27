/**
 * Validates a single requirement object from requirements.json.
 *
 * Required fields: name, points, check.
 * - `points` must be a number (supports fractional values).
 * - `check`  must be an object defining the assertion to run.
 *
 * For CSS assertions (check.type === "css"), at minimum either:
 *   - check.property + check.value  (single property assertion)
 *   - check.styles                  (grouped styles assertion)
 *
 * @param {object} requirement - The requirement object to validate.
 * @throws {Error} If a required field is missing or has the wrong type.
 */
export function validateRequirement(requirement) {

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

  if (typeof requirement.points !== "number") {

    throw new Error(
      `"points" must be a number.`
    );

  }

  if (typeof requirement.check !== "object") {

    throw new Error(
      `"check" must be an object.`
    );

  }

  const { check } = requirement;

  if (check.type === "css") {
    if (!check.selector) {
      throw new Error(
        `CSS assertion must include "selector".`
      );
    }
    if (!check.property && !check.styles && !check.assertion) {
      throw new Error(
        `CSS assertion must include "property" + "value", "styles", or "assertion".`
      );
    }
  }

}
