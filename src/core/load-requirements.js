import fs from "fs";
import { validateRequirement } from "./validate-requirement.js";


/**
 * Reads requirements.json from disk, parses it, and validates
 * every requirement against the expected schema before returning
 * the definition object.
 *
 * @param {string} filePath - Absolute path to requirements.json.
 * @returns {object} The parsed lab definition, including a `requirements` array.
 * @throws {Error} If a requirement is missing a required field or has an invalid type.
 */
export function loadRequirements(filePath) {

  // Read the raw JSON file from disk
  const content =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  // Parse the JSON into a JavaScript object
  const definition =
    JSON.parse(content);

  // Validate each requirement's schema before proceeding.
  // This surfaces authoring errors early, before any assertions run.
  for (const requirement of definition.requirements) {
    validateRequirement(requirement);
  }

  return definition;
}