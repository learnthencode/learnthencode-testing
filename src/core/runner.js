import { discoverTests } from "./discover-tests.js";
import { loadRequirements } from "./load-requirements.js";
import { loadHTML } from "./load-html.js";
import { executeRequirement } from "./execute-requirements.js";
import { createResultCollection } from "./results.js";


export function run(labDirectory) {
    const discovered = discoverTests(labDirectory);


    const requirementsFile = discovered.tests.find(
        (test) => test.type === "requirements"
    );


    if (!requirementsFile) {
        throw new Error(
            "No requirements.json file found."
        );
    }


    const labDefinition =
        loadRequirements(
            requirementsFile.path
        );


    const requirements =
        labDefinition.requirements;


    const html =
        loadHTML(
            `${labDirectory}/starter/index.html`
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