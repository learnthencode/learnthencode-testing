import fs from "fs";


/**
 * Loads an HTML file.
 *
 * @param {string} filePath
 * @returns {string}
 */
export function loadHTML(filePath) {
  return fs.readFileSync(
    filePath,
    "utf-8"
  );
}