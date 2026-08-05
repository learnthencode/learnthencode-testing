import { expect } from "../expect.js";
import {
  parseSource,
  importsModule,
  importsName,
  findUseEffectCalls,
  hasDependencyArray,
  hasCleanup,
  getExportedFunctions,
  callsAHook,
  findJsxElements,
  getJsxAttribute,
} from "./ast.js";

/**
 * Static source assertions (v1.3.1).
 *
 * These assertions inspect React source files through an AST produced by
 * @babel/parser — never string matching — so formatting differences
 * (whitespace, quotes, line breaks) cannot affect the outcome. They run
 * on the project on disk and never bundle or render:
 *
 *   - effect           — useEffect is imported and called.
 *   - dependencyArray  — a useEffect call passes a dependency array.
 *   - cleanup          — an effect returns a cleanup function.
 *   - customHook       — an exported "use*" function calls a React hook.
 *   - imports          — expected module specifiers are imported.
 *   - fileExists       — a file exists on disk.
 *   - folderExists     — a folder exists on disk.
 *   - route            — a <Route path="..."> matches the expected path.
 *   - routeParam       — a dynamic <Route path="/users/:id"> exists.
 *   - navLink          — a <Link to="..."> or <NavLink to="..."> matches.
 */

function fail(requirement, message) {
  return expect({ requirement, condition: false, message });
}

function pass(requirement) {
  return expect({ requirement, condition: true });
}

/**
 * Reads and parses the component file named by check.component.
 *
 * @returns {{ ast: object|null, error: string|null }}
 */
function readAst(engine, check, requirement) {
  if (!engine.fileExists(check.component)) {
    return {
      ast: null,
      error: `Expected component file "${check.component}" to exist, but it was not found. Create it in the lab.`,
    };
  }

  const source = engine.readFile(check.component);
  const parsed = parseSource(source);
  if (parsed.error) {
    return {
      ast: null,
      error: `The source in "${check.component}" could not be parsed: ${parsed.error.message}`,
    };
  }
  return { ast: parsed.ast, error: null };
}

function readAstResult(engine, check, requirement) {
  const { ast, error } = readAst(engine, check, requirement);
  if (error) {
    return { result: fail(requirement, error), ast: null };
  }
  return { result: null, ast };
}

/**
 * Asserts the component imports and calls useEffect.
 *
 * check.component — the component file relative to the lab.
 */
export function effectAssertion(engine, requirement) {
  const { check } = requirement;

  const { result, ast } = readAstResult(engine, check, requirement);
  if (result) {
    return result;
  }

  if (!importsName(ast, "react", "useEffect")) {
    return fail(
      requirement,
      `"${check.component}" does not import useEffect. Add useEffect to the react import (e.g. import { useEffect, useState } from "react").`
    );
  }

  if (findUseEffectCalls(ast).length === 0) {
    return fail(
      requirement,
      `"${check.component}" imports useEffect but never calls it. Call useEffect(() => { ... }, []) inside the component.`
    );
  }

  return pass(requirement);
}

/**
 * Asserts a useEffect call passes a dependency array as its second
 * argument.
 *
 * Accepts useEffect(() => {}, []) and useEffect(() => {}, [count]);
 * rejects useEffect(() => {}).
 *
 * check.component — the component file relative to the lab.
 */
export function dependencyArrayAssertion(engine, requirement) {
  const { check } = requirement;

  const { result, ast } = readAstResult(engine, check, requirement);
  if (result) {
    return result;
  }

  const effects = findUseEffectCalls(ast);
  if (effects.length === 0) {
    return fail(
      requirement,
      `No useEffect call was found in "${check.component}". Use useEffect(() => { ... }, []) with a dependency array.`
    );
  }

  if (!effects.some(hasDependencyArray)) {
    return fail(
      requirement,
      `The useEffect call in "${check.component}" is missing a dependency array. Pass a second argument, e.g. useEffect(() => { ... }, []) for run-once effects or [count] when the effect depends on state.`
    );
  }

  return pass(requirement);
}

/**
 * Asserts an effect returns a cleanup function.
 *
 * Accepts useEffect(() => { return () => {}; }, []) and equivalent
 * implicit returns.
 *
 * check.component — the component file relative to the lab.
 */
export function cleanupAssertion(engine, requirement) {
  const { check } = requirement;

  const { result, ast } = readAstResult(engine, check, requirement);
  if (result) {
    return result;
  }

  const effects = findUseEffectCalls(ast);
  if (effects.length === 0) {
    return fail(
      requirement,
      `No useEffect call was found in "${check.component}", so no cleanup function could be verified. Add an effect that returns a cleanup function.`
    );
  }

  if (!effects.some(hasCleanup)) {
    return fail(
      requirement,
      `No effect in "${check.component}" returns a cleanup function. Return one from the effect callback, e.g. useEffect(() => { ... return () => { ... }; }, []).`
    );
  }

  return pass(requirement);
}

/**
 * Asserts the file exports a custom hook: an exported function whose
 * name starts with "use" that calls at least one React hook.
 *
 * check.component — the hook file relative to the lab (e.g. "src/hooks/useCounter.js").
 */
export function customHookAssertion(engine, requirement) {
  const { check } = requirement;

  const { result, ast } = readAstResult(engine, check, requirement);
  if (result) {
    return result;
  }

  const exported = getExportedFunctions(ast);
  const hooks = exported.filter((entry) => entry.name.startsWith("use"));

  if (hooks.length === 0) {
    return fail(
      requirement,
      `"${check.component}" does not export a custom hook. Export a function whose name starts with "use" (e.g. export function useCounter() { ... }).`
    );
  }

  const withoutHookCall = hooks.find((entry) => !callsAHook(entry.node));
  if (withoutHookCall) {
    return fail(
      requirement,
      `The custom hook "${withoutHookCall.name}" in "${check.component}" does not call any React hooks. Custom hooks must use at least one hook such as useState, useEffect, or useRef.`
    );
  }

  return pass(requirement);
}

/**
 * Asserts the expected module specifiers are imported.
 *
 * check.component — the component file relative to the lab.
 * check.expect    — array of module specifiers (e.g. ["react-router-dom"]).
 */
export function importsAssertion(engine, requirement) {
  const { check } = requirement;

  const { result, ast } = readAstResult(engine, check, requirement);
  if (result) {
    return result;
  }

  const missing = check.expect.filter((source) => !importsModule(ast, source));
  if (missing.length > 0) {
    const quoted = missing.map((source) => `"${source}"`).join(", ");
    return fail(
      requirement,
      `"${check.component}" does not import ${quoted}. Add an import statement for each module, e.g. import ... from "${missing[0]}".`
    );
  }

  return pass(requirement);
}

/**
 * Asserts a file exists in the lab.
 *
 * check.path — the file path relative to the lab.
 */
export function fileExistsAssertion(engine, requirement) {
  const { check } = requirement;

  if (!engine.fileExists(check.path)) {
    return fail(
      requirement,
      `Expected the file "${check.path}" to exist, but it was not found. Create it at the lab root.`
    );
  }

  return pass(requirement);
}

/**
 * Asserts a folder exists in the lab.
 *
 * check.path — the folder path relative to the lab.
 */
export function folderExistsAssertion(engine, requirement) {
  const { check } = requirement;

  if (!engine.directoryExists(check.path)) {
    return fail(
      requirement,
      `Expected the folder "${check.path}" to exist, but it was not found. Create it at the lab root.`
    );
  }

  return pass(requirement);
}

/**
 * Asserts a <Route> with the expected path exists.
 *
 * check.component — the component file relative to the lab.
 * check.path      — the route path (e.g. "/about").
 */
export function routeAssertion(engine, requirement) {
  const { check } = requirement;

  const { result, ast } = readAstResult(engine, check, requirement);
  if (result) {
    return result;
  }

  const paths = findJsxElements(ast, "Route")
    .map((element) => getJsxAttribute(element, "path"))
    .filter((value) => value !== null);

  if (!paths.includes(check.path)) {
    return fail(
      requirement,
      `No <Route path="${check.path}"> was found in "${check.component}". Add one inside <Routes> (found paths: ${listOrNone(paths)}).`
    );
  }

  return pass(requirement);
}

/**
 * Asserts a dynamic route parameter exists, e.g. <Route path="/users/:id">.
 *
 * check.component — the component file relative to the lab.
 * check.path      — the parameterized route path (e.g. "/users/:id").
 */
export function routeParamAssertion(engine, requirement) {
  const { check } = requirement;

  const { result, ast } = readAstResult(engine, check, requirement);
  if (result) {
    return result;
  }

  const paths = findJsxElements(ast, "Route")
    .map((element) => getJsxAttribute(element, "path"))
    .filter((value) => value !== null);

  if (!paths.includes(check.path)) {
    return fail(
      requirement,
      `No <Route path="${check.path}"> was found in "${check.component}". Add a dynamic route with a ":" parameter so it can read values via useParams() (found paths: ${listOrNone(paths)}).`
    );
  }

  return pass(requirement);
}

/**
 * Asserts a navigation link targets the expected path.
 *
 * Accepts <Link to="/about"> and <NavLink to="/about">.
 *
 * check.component — the component file relative to the lab.
 * check.expect    — the target path (e.g. "/about").
 */
export function navLinkAssertion(engine, requirement) {
  const { check } = requirement;

  const { result, ast } = readAstResult(engine, check, requirement);
  if (result) {
    return result;
  }

  const links = [
    ...findJsxElements(ast, "Link"),
    ...findJsxElements(ast, "NavLink"),
  ];

  const matches = links
    .map((element) => getJsxAttribute(element, "to"))
    .filter((value) => value !== null);

  if (!matches.includes(check.expect)) {
    return fail(
      requirement,
      `No <Link to="${check.expect}"> or <NavLink to="${check.expect}"> was found in "${check.component}". Add a link with a "to" prop pointing at that path (found: ${listOrNone(matches)}).`
    );
  }

  return pass(requirement);
}

/**
 * Formats a path list for failure messages.
 */
function listOrNone(paths) {
  return paths.length > 0 ? paths.map((p) => `"${p}"`).join(", ") : "none";
}
