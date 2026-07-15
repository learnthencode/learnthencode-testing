import fs from "fs";
import path from "path";

/**
 * Loads hidden tests from a local directory.
 *
 * @param {string} testsDirectory
 * @returns {string}
 */
export function loadTests(testsDirectory) {

  const requirementsPath = path.resolve(
    testsDirectory,
    "requirements.json"
  );

  if (!fs.existsSync(requirementsPath)) {
    throw new Error("No hidden requirements.json found.");
  }

  return requirementsPath;
}