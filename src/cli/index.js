import { MESSAGES } from "../constants/messages.js";
import { parseArguments } from "./parser.js";
import { handleCommand } from "./commands.js";

/**
 * Starts the LearnThenCode Testing Framework CLI.
 */
export function start() {
  const argumentsParsed = parseArguments(process.argv);

  console.log(MESSAGES.banner);

  handleCommand(argumentsParsed);
}