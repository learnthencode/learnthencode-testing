import fs from "fs";
import { validateRequirement } from "./validate-requirement.js";

export function loadRequirements(filePath) {

  const content =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  const definition =
    JSON.parse(content);

  for (const requirement of definition.requirements) {
    validateRequirement(requirement);
  }

  return definition;
}