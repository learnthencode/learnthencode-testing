import { expect } from "../expect.js";

/**
 * Static React assertions (v1.3.0).
 *
 * These assertions inspect the project on disk — no rendering happens —
 * so they work even when the lab has never been bundled:
 *
 *   - project      — the submission looks like a React project.
 *   - dependency   — required packages are listed in package.json.
 *   - component    - an expected component file exists.
 *   - jsx          — the file contains valid JSX.
 */

const ENTRY_FILES = ["src/main.jsx", "src/main.js", "src/App.jsx", "src/App.js"];

const JSX_PATTERN = /<\/?[A-Za-z][^>]*>|<>/;

const EXPORT_PATTERN =
  /export\s+(default\s+)?(function|const|let|var|class)|\bexport\s*\{/;

function fail(requirement, message) {
  return expect({ requirement, condition: false, message });
}

function pass(requirement) {
  return expect({ requirement, condition: true });
}

/**
 * Asserts the submission is a React project.
 *
 * check fields:
 *   - entry    — required entry file (relative to the lab).
 *   - tooling  — "vite" or "cra" (Create React App) when specified.
 */
export function projectAssertion(engine, requirement) {
  const { check } = requirement;

  if (!engine.packageJsonPresent) {
    return fail(
      requirement,
      "No package.json was found. A React project must have a package.json (created by Vite or Create React App)."
    );
  }

  if (check.entry) {
    if (!engine.fileExists(check.entry)) {
      return fail(
        requirement,
        `Expected the entry file "${check.entry}" to exist, but it was not found. Create it at the lab root.`
      );
    }
  } else {
    const found = ENTRY_FILES.some((file) => engine.fileExists(file));
    if (!found) {
      return fail(
        requirement,
        "This does not look like a React project. Create an entry file such as src/main.jsx or src/App.jsx."
      );
    }
  }

  if (check.tooling) {
    const tooling = engine.getProjectTooling();
    const expected =
      check.tooling === "vite" ? "Vite" : "Create React App";
    if (tooling !== check.tooling) {
      return fail(
        requirement,
        `Expected a ${expected} project, but package.json does not list ${
          check.tooling === "vite" ? '"vite"' : '"react-scripts"'
        } in devDependencies.`
      );
    }
  }

  return pass(requirement);
}

/**
 * Asserts required React dependencies are present in package.json.
 *
 * check.dependencies — array of package names (e.g. ["react", "react-dom"]).
 */
export function dependencyAssertion(engine, requirement) {
  const { check } = requirement;

  if (!engine.packageJsonPresent) {
    return fail(
      requirement,
      "No package.json was found, so dependencies cannot be verified. Create a package.json first."
    );
  }

  const missing = check.dependencies.filter(
    (dependency) => !engine.hasDependency(dependency)
  );

  if (missing.length > 0) {
    const quoted = missing.map((dependency) => `"${dependency}"`).join(", ");
    const label = missing.length === 1 ? "dependency is" : "dependencies are";
    return fail(
      requirement,
      `The required ${label} missing from package.json: ${quoted}. Install them with "npm install ${missing[0]}" (or the full list).`
    );
  }

  return pass(requirement);
}

/**
 * Asserts an expected component file exists (and optionally exports a
 * functional component).
 *
 * check fields:
 *   - component          — file path relative to the lab.
 *   - exported           — require an export statement in the file.
 *   - functionComponent  — require the export to be a functional component.
 */
export async function componentAssertion(engine, requirement) {
  const { check } = requirement;

  if (!engine.fileExists(check.component)) {
    return fail(
      requirement,
      `Expected component file "${check.component}" to exist, but it was not found. Create it in the lab.`
    );
  }

  if (check.exported) {
    const source = engine.readFile(check.component);
    if (!EXPORT_PATTERN.test(source)) {
      return fail(
        requirement,
        `The component file "${check.component}" does not export anything. Add an export (e.g. "export default function ...").`
      );
    }
  }

  if (check.functionComponent) {
    const { component, error } = await engine.getComponent({
      file: check.component,
      exportName: check.exportName,
    });
    if (error) {
      return fail(requirement, error);
    }
    const isClassComponent =
      typeof component.toString === "function" &&
      component.toString().trim().startsWith("class");
    if (isClassComponent) {
      return fail(
        requirement,
        `"${check.component}" exports a class component. This lab requires a functional component (a plain function, optionally using hooks).`
      );
    }
  }

  return pass(requirement);
}

/**
 * Asserts a component file contains valid JSX.
 *
 * check.component — file path relative to the lab.
 */
export async function jsxAssertion(engine, requirement) {
  const { check } = requirement;

  if (!engine.fileExists(check.component)) {
    return fail(
      requirement,
      `Expected component file "${check.component}" to exist, but it was not found. Create it in the lab.`
    );
  }

  const source = engine.readFile(check.component);
  if (!JSX_PATTERN.test(source)) {
    return fail(
      requirement,
      `No JSX was found in "${check.component}". Components should return JSX markup (e.g. <div>...</div>), not plain strings.`
    );
  }

  const absolutePath = engine.resolve(check.component);
  const { error } = await engine.buildFile(absolutePath);
  if (error) {
    return fail(
      requirement,
      `The JSX in "${check.component}" could not be parsed: ${error}`
    );
  }

  return pass(requirement);
}
