/**
 * Validates a single requirement.
 *
 * @param {object} requirement
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

}