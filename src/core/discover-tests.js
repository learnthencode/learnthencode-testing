import fs from "fs";
import path from "path";

/**
 * Discovers tests inside a lab directory.
 *
 * @param {string} labPath
 * @returns {object}
 */
export function discoverTests(labPath) {
  const testsPath = path.join(
    labPath,
    "tests"
  );

  if (!fs.existsSync(testsPath)) {
    return {
      tests: [],
    };
  }

  const files = fs.readdirSync(testsPath);

  return {
    tests: files.map((file) => ({
      file,
      path: path.join(
        testsPath,
        file
      ),
    })),
  };
}