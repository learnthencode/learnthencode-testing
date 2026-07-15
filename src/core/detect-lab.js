import fs from "fs";
import path from "path";

/**
 * Detects the current LearnThenCode lab.
 *
 * @returns {string}
 */
export function detectLab() {
  const currentDirectory = process.cwd();

  const configPath = path.join(
    currentDirectory,
    "learnthencode.json"
  );

  if (!fs.existsSync(configPath)) {
    throw new Error(
      "This directory is not a LearnThenCode lab."
    );
  }

  return currentDirectory;
}