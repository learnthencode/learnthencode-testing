import { loadTests } from "../providers/local-provider.js";
import { loadRequirements } from "./load-requirements.js";
import { loadHTML } from "./load-html.js";
import { executeRequirement, isJSType } from "./execute-requirements.js";
import { createResultCollection } from "./results.js";
import { loadLab } from "./lab.js";
import { createJSEngine, extractScriptCode } from "./js-execution-engine.js";
import path from "path";

export async function run(labDirectory) {
    const lab = loadLab(labDirectory);

    const testsDirectory = path.join(
        labDirectory,
        "private-tests"
    );

    const requirementsFile = loadTests(testsDirectory);

    const labDefinition = loadRequirements(requirementsFile);

    const requirements = labDefinition.requirements;

    const entryFilePath = path.join(
        labDirectory,
        lab.entry
    );

    const entryContent = loadHTML(entryFilePath);
    const entryExt = path.extname(lab.entry).toLowerCase();

    const hasJSRequirements = requirements.some(
      r => isJSType(r.check.type)
    );

    let html = entryContent;
    let jsEngine = null;

    if (hasJSRequirements) {
      if (entryExt === ".html") {
        const code = extractScriptCode(entryContent, path.dirname(entryFilePath));
        html = entryContent;
        if (code) {
          jsEngine = createJSEngine({ code, html });
        }
      } else if (entryExt === ".js") {
        const code = entryContent;
        html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body></body></html>";
        jsEngine = createJSEngine({ code, html });
      }
    }

    const results = createResultCollection();

    for (const requirement of requirements) {
        results.add(
            await executeRequirement(
                requirement,
                html,
                entryFilePath,
                jsEngine
            )
        );
    }

    return results;
}
