import fs from "fs";
import path from "path";


/**
 * Detects whether the current working directory is a LearnThenCode lab
 * by looking for a `learnthencode.json` configuration file.
 *
 * Learners are expected to run `learnthencode-test run` from inside
 * their lab directory (the one that contains learnthencode.json).
 *
 * @returns {string} The absolute path to the detected lab directory.
 * @throws {Error} If learnthencode.json is not found in the current directory.
 */
export function detectLab() {
  const currentDirectory = process.cwd();

  // A lab directory is identified by the presence of learnthencode.json
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