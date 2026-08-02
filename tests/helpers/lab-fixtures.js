import fs from "fs";
import os from "os";
import path from "path";

/**
 * Creates a temporary lab directory on disk for end-to-end runner tests.
 *
 * The lab layout mirrors the real one:
 *   <tmp>/learnthencode.json
 *   <tmp>/starter/index.html          (plus any extra starter files)
 *   <tmp>/private-tests/requirements.json
 *
 * @param {object} options
 * @param {string} [options.html] - Content of starter/index.html.
 * @param {string} [options.entry] - Entry path (defaults to "starter/index.html").
 * @param {object} [options.files] - Extra files inside starter/ (name -> content).
 * @param {object[]} options.requirements - The requirements array for requirements.json.
 * @returns {string} The absolute path of the temporary lab directory.
 */
export function createTempLab({
  html = "<!DOCTYPE html><html><body></body></html>",
  entry = "starter/index.html",
  files = {},
  requirements,
}) {
  const labDir = fs.mkdtempSync(path.join(os.tmpdir(), "ltnc-lab-"));

  fs.writeFileSync(
    path.join(labDir, "learnthencode.json"),
    JSON.stringify({
      id: "temp-lab",
      title: "Temporary Lab",
      lesson: "lesson-temp",
      language: "html",
      entry,
      version: "1.0.0",
    })
  );

  const starterDir = path.join(labDir, path.dirname(entry));
  fs.mkdirSync(starterDir, { recursive: true });

  if (html !== null) {
    fs.writeFileSync(path.join(labDir, entry), html);
  }

  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(starterDir, name), content);
  }

  fs.mkdirSync(path.join(labDir, "private-tests"), { recursive: true });
  fs.writeFileSync(
    path.join(labDir, "private-tests", "requirements.json"),
    JSON.stringify({ requirements: requirements || [] })
  );

  return labDir;
}

/**
 * Removes a temporary lab directory created by createTempLab().
 *
 * @param {string} labDir
 */
export function removeTempLab(labDir) {
  fs.rmSync(labDir, { recursive: true, force: true });
}

/**
 * Runs a full lab and returns its results collection.
 *
 * @param {string} labDir
 * @returns {Promise<object>}
 */
export async function runLab(labDir) {
  const { run } = await import("../../src/core/runner.js");
  return run(labDir);
}
