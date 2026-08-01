import { run } from "./runner.js";
import { report } from "../reporter/console-reporter.js";

const results = await run("./test-lab");

report(results);