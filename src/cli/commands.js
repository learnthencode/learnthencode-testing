import { MESSAGES } from "../constants/messages.js";
import { detectLab } from "../core/detect-lab.js";
import { run } from "../core/runner.js";
import { report } from "../reporter/console-reporter.js";


/**
 * Handles CLI commands and options.
 *
 * @param {object} args
 */
export async function handleCommand(args) {
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

    const labDirectory = detectLab();

    const results = run(labDirectory);

    report(results);

    return;
}


  console.log(MESSAGES.unknownCommand);
}