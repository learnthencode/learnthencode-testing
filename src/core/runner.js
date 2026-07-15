import { loadTests } from "../providers/local-provider.js";
import { loadRequirements } from "./load-requirements.js";
import { loadHTML } from "./load-html.js";
import { executeRequirement } from "./execute-requirements.js";
import { createResultCollection } from "./results.js";
import { loadLab } from "./lab.js";
import path from "path";

export function run(labDirectory) {
    const lab = loadLab(labDirectory);

    const testsDirectory = path.join(
        labDirectory,
        "..",
        "private-tests"
    );

    const requirementsFile = loadTests(
        testsDirectory
    );

    const labDefinition =
        loadRequirements(
            requirementsFile
        );


    const requirements =
        labDefinition.requirements;


    const html = loadHTML(
        path.join(
            labDirectory,
            lab.entry
        )
    );

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