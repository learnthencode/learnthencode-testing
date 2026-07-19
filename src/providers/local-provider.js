import fs from "fs";
import path from "path";


/**
 * Resolves and returns the path to requirements.json inside the
 * private-tests directory.
 *
 * The "local" provider reads test files directly from the filesystem,
 * as opposed to a remote provider that might fetch them from an API.
 * This keeps the hidden test files out of the learner's lab directory
 * while still being accessible on the same machine.
 *
 * @param {string} testsDirectory - Absolute path to the private-tests directory.
 * @returns {string} Absolute path to requirements.json.
 * @throws {Error} If requirements.json does not exist in the given directory.
 */
export function loadTests(testsDirectory) {

  // Build the expected path to the requirements file
  const requirementsPath = path.resolve(
    testsDirectory,
    "requirements.json"
  );

  // Fail fast if the file is missing — the runner cannot proceed without it
  if (!fs.existsSync(requirementsPath)) {
    throw new Error("No hidden requirements.json found.");
  }

  return requirementsPath;
}