import { success, error } from "./colors.js";


/**
 * Reports test execution results.
 *
 * @param {Array} results
 */
export function report(results) {
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(" LearnThenCode Test ");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  let passed = 0;
  let failed = 0;


  for (const result of results) {

    if (result.passed) {
      passed++;

      console.log(
        `${success("✔")} ${result.name}`
      );

    } else {
      failed++;

      console.log(
        `${error("✘")} ${result.name}`
      );

      if (result.message) {
        console.log(
          `  ${result.message}`
        );
      }

      if (result.hint) {
        console.log(
          `  Hint: ${result.hint}`
        );
      }
    }

    console.log("");
  }


  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log(
    `Passed: ${passed}`
  );

  console.log(
    `Failed: ${failed}`
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}