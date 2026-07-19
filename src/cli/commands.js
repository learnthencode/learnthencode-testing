import { MESSAGES } from "../constants/messages.js";
import { detectLab } from "../core/detect-lab.js";
import { run } from "../core/runner.js";
import { report } from "../reporter/console-reporter.js";


/**
 * Routes a parsed CLI invocation to the appropriate action.
 *
 * Supported usage:
 *   learnthencode-test run       — Run the lab's tests.
 *   learnthencode-test --help    — Print help text.
 *   learnthencode-test --version — Print version string.
 *
 * @param {object} args
 * @param {string|null} args.command - The first positional argument (e.g. "run").
 * @param {string|null} args.option  - Set when the first argument begins with "--".
 */
export async function handleCommand(args) {
  const { command, option } = args;

  // --help: print usage instructions and exit
  if (option === "help") {
    console.log(MESSAGES.help);
    return;
  }

  // --version: print the current version string and exit
  if (option === "version") {
    console.log(MESSAGES.version);
    return;
  }

  // run: detect the lab, execute all requirements, and print the report
  if (command === "run") {

    // Throws if the current directory is not a valid LearnThenCode lab
    const labDirectory = detectLab();

    const results = run(labDirectory);

    report(results);

    return;
  }

  // Unrecognised command — guide the user to --help
  console.log(MESSAGES.unknownCommand);
}