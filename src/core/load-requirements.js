import fs from "fs";


/**
 * Loads a requirements test file.
 *
 * @param {string} filePath
 * @returns {object}
 */
export function loadRequirements(filePath) {
  const content = fs.readFileSync(
    filePath,
    "utf-8"
  );


  return JSON.parse(content);
}