import fs from "fs";
import path from "path";
import { validateLab } from "./validate-lab.js";


/**
 * Loads a LearnThenCode lab.
 *
 * @param {string} labDirectory
 * @returns {object}
 */
export function loadLab(labDirectory) {

  const configPath = path.resolve(
  labDirectory,
  "learnthencode.json"
);


  if (!fs.existsSync(configPath)) {
    throw new Error(
      "learnthencode.json not found."
    );
  }


  const config = JSON.parse(
    fs.readFileSync(
      configPath,
      "utf-8"
    )
  );

  validateLab(config);

  return {
    ...config,
    directory: labDirectory,
  };
}