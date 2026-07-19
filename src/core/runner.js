import { loadTests } from "../providers/local-provider.js";
import { loadRequirements } from "./load-requirements.js";
import { loadHTML } from "./load-html.js";
import { executeRequirement } from "./execute-requirements.js";
import { createResultCollection } from "./results.js";
import { loadLab } from "./lab.js";
import path from "path";


/**
 * Runs all requirements for a given lab directory and returns
 * a result collection containing pass/fail outcomes and scores.
 *
 * Pipeline:
 *   1. Load and validate the lab configuration (learnthencode.json).
 *   2. Locate the hidden requirements.json from the private-tests directory.
 *   3. Parse and validate all requirements.
 *   4. Load the learner's HTML entry file.
 *   5. Execute each requirement assertion against the HTML.
 *   6. Return the collected results.
 *
 * @param {string} labDirectory - Absolute path to the lab directory.
 * @returns {object} A result collection with results and a summary().
 */
export function run(labDirectory) {
    // Load and validate the lab config (learnthencode.json)
    const lab = loadLab(labDirectory);

    // private-tests lives one level above the lab directory,
    // keeping hidden test files out of the learner's workspace.
    const testsDirectory = path.join(
        labDirectory,
        "..",
        "private-tests"
    );

    // Resolve the path to requirements.json inside private-tests
    const requirementsFile = loadTests(
        testsDirectory
    );

    // Parse requirements.json and validate each requirement's schema
    const labDefinition =
        loadRequirements(
            requirementsFile
        );

    const requirements =
        labDefinition.requirements;

    // Read the learner's HTML submission from disk
    const html = loadHTML(
        path.join(
            labDirectory,
            lab.entry  // e.g. "starter/index.html"
        )
    );

    // Collect results from each requirement assertion
    const results =
        createResultCollection();

    for (const requirement of requirements) {
        results.add(
            executeRequirement(
                requirement,
                html
            )
        );
    }

    return results;
}