import { MESSAGES } from "../constants/messages.js";

/**
 * Handles CLI commands and options.
 *
 * @param {object} args
 */
export function handleCommand(args) {
  const { command, option } = args;

  if (option === "help") {
    console.log(MESSAGES.help);
    return;
  }

  if (option === "version") {
    console.log(MESSAGES.version);
    return;
  }

  if (command === "run") {
    console.log("Test runner coming soon...");
    return;
  }

  console.log(MESSAGES.unknownCommand);
}