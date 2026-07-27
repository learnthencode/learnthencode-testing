import { success, error } from "./colors.js";


/**
 * Prints a formatted test report to stdout.
 *
 * @param {object} resultCollection - A result collection produced by createResultCollection().
 */
export function report(resultCollection) {

    const results = resultCollection.results;

    const reportSummary = resultCollection.summary();


    console.log("");

    console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
        " LearnThenCode Test "
    );

    console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log("");


    for (const result of results) {

        if (result.passed) {

            console.log(
                `${success("✔")} ${result.name}`
            );

        } else {

            console.log(
                `${error("✘")} ${result.name}`
            );

            if (result.message) {
                const lines = result.message.split("\n");
                for (const line of lines) {
                    console.log(`  ${line}`);
                }
            }

            if (result.hint) {
                console.log(
                    `  Hint: ${result.hint}`
                );
            }
        }

        console.log("");
    }


    console.log(
        `Passed: ${reportSummary.passed}`
    );

    console.log(
        `Failed: ${reportSummary.failed}`
    );

    console.log("");

    console.log(
        `Score: ${reportSummary.earned}/${reportSummary.points}`
    );

    console.log(
        `Percentage: ${reportSummary.percentage}%`
    );
}
