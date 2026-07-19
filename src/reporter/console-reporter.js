import { success, error } from "./colors.js";


/**
 * Prints a formatted test report to stdout.
 *
 * Output sections:
 *   1. A header banner.
 *   2. One line per result — a green ✔ for passes and a red ✘ for failures,
 *      followed by the failure message and optional hint.
 *   3. A summary showing passed/failed counts, raw score, and percentage.
 *
 * @param {object} resultCollection - A result collection produced by createResultCollection().
 */
export function report(resultCollection) {

    const results = resultCollection.results;

    // Compute aggregate stats (total, passed, failed, points, earned, percentage)
    const reportSummary = resultCollection.summary();


    // ── Header ───────────────────────────────────────────────────────────────
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


    // ── Per-result output ─────────────────────────────────────────────────────
    for (const result of results) {

        if (result.passed) {

            // Green tick for a passing requirement
            console.log(
                `${success("✔")} ${result.name}`
            );

        } else {

            // Red cross for a failing requirement
            console.log(
                `${error("✘")} ${result.name}`
            );

            // Describe what was wrong (e.g. "Could not find h1 element.")
            if (result.message) {
                console.log(
                    `  ${result.message}`
                );
            }

            // Give the learner a nudge in the right direction
            if (result.hint) {
                console.log(
                    `  Hint: ${result.hint}`
                );
            }
        }

        console.log("");
    }


    // ── Summary ───────────────────────────────────────────────────────────────
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