/**
 * Parses the raw process.argv array into a structured arguments object.
 *
 * process.argv format: ["node", "/path/to/script.js", ...userArgs]
 * We only care about the user-provided arguments (index 2 onwards).
 *
 * Returns:
 *   - `command` — the first user argument as-is (e.g. "run"), or null.
 *   - `option`  — the first argument stripped of its "--" prefix if it starts
 *                 with "--" (e.g. "--help" → "help"), otherwise null.
 *
 * @param {string[]} args - The raw process.argv array.
 * @returns {{ command: string|null, option: string|null }}
 */
export function parseArguments(args) {
  // Drop "node" (index 0) and the script path (index 1)
  const userArguments = args.slice(2);

  return {
    // The raw first argument (positional command like "run")
    command: userArguments[0] ?? null,

    // If the first argument starts with "--", treat it as a flag option
    option: userArguments[0]?.startsWith("--")
      ? userArguments[0].replace("--", "")
      : null,
  };
}