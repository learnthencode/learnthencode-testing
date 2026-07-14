/**
 * Parses command line arguments.
 *
 * @param {string[]} args
 * @returns {object}
 */
export function parseArguments(args) {
  const userArguments = args.slice(2);

  return {
    command: userArguments[0] ?? null,
    option: userArguments[0]?.startsWith("--")
      ? userArguments[0].replace("--", "")
      : null,
  };
}