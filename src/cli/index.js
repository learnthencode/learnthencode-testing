import { MESSAGES } from "../constants/messages.js";
import { parseArguments } from "./parser.js";
import { handleCommand } from "./commands.js";


/**
 * Entry point for the LearnThenCode Testing Framework CLI.
 *
 * Parses the process arguments, prints the startup banner, then
 * delegates to handleCommand() which routes to the correct action.
 */
export async function start() {
  // Slice off "node" and the script path; keep only user-provided arguments
  const argumentsParsed = parseArguments(process.argv);

  // Always print the banner so users know which tool and version they're running
  console.log(MESSAGES.banner);

  await handleCommand(argumentsParsed);
}