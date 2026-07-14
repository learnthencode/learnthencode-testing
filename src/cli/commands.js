import { MESSAGES } from "../constants/messages.js";


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
    const { run } = await import("../core/runner.js");
    const { report } = await import("../reporter/console-reporter.js");


    const results = run("./test-lab");

    report(results);

    return;
  }


  console.log(MESSAGES.unknownCommand);
}