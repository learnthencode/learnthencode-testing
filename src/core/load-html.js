import fs from "fs";


/**
 * Reads an HTML file from disk and returns its raw content as a string.
 *
 * The returned string is passed directly to Cheerio's `load()` for
 * DOM parsing in each assertion. Reading it once here avoids redundant
 * disk I/O across multiple requirements.
 *
 * @param {string} filePath - Absolute path to the HTML file.
 * @returns {string} The raw HTML content.
 */
export function loadHTML(filePath) {
  return fs.readFileSync(
    filePath,
    "utf-8"
  );
}