import { JSDOM } from "jsdom";
import * as ReactNS from "react";
import * as ReactDOMNS from "react-dom";
import * as ReactDOMClientNS from "react-dom/client";
import * as jsxRuntimeNS from "react/jsx-runtime";
import * as ReactRouterNS from "react-router-dom";

/**
 * Shared browser-like environment for React component testing (v1.3.0).
 *
 * React (and react-dom) are host-realm modules: when a React component
 * rendered inside jsdom triggers a state update or an effect, react-dom
 * reads globals such as `document` and `window` from the host Node.js
 * process. The environment therefore installs the jsdom window, document,
 * and navigator as host globals before any component is rendered — the
 * same approach used by react-testing-library. The environment also
 * enables `act()` (React 19) and installs a `reportError` capture so an
 * uncaught error inside a component can never crash the test process.
 *
 * Multiple engines (one per lab run) each create their own jsdom, and
 * the latest environment is registered on the host `globalThis` so the
 * standalone programmatic helpers (renderReact, fireEvent, ...) always
 * share the same window as the component they operate on.
 */

const GLOBAL_KEY = "__LTNC_REACT_TEST_ENV__";

let sharedEnvironment = null;

/**
 * Resolves a named export from a Node ESM namespace object produced by
 * `import * as X from "..."`. CJS packages (react, react-dom) expose
 * their real exports under `default`, so both shapes are handled.
 *
 * @param {object} module - The ESM namespace object.
 * @param {string} name - The export name.
 * @returns {*} The named export, or undefined.
 */
export function getNamed(module, name) {
  return (
    module[name] ??
    module.default?.[name] ??
    module.default?.default?.[name]
  );
}

/**
 * Normalized host modules. Each keeps every named export and a `default`
 * pointing at the underlying CJS exports, so the same objects can be
 * handed to bundled student code through the sandbox `require` shim.
 */
export const React = {
  ...ReactNS,
  default: getNamed(ReactNS, "default") ?? ReactNS,
};

export const reactDom = {
  ...ReactDOMNS,
  default: getNamed(ReactDOMNS, "default") ?? ReactDOMNS,
};

export const reactDomClient = {
  ...ReactDOMClientNS,
  default: getNamed(ReactDOMClientNS, "default") ?? ReactDOMClientNS,
};

export const jsxRuntime = {
  ...jsxRuntimeNS,
  default: getNamed(jsxRuntimeNS, "default") ?? jsxRuntimeNS,
};

export const reactRouterDom = {
  ...ReactRouterNS,
  default: getNamed(ReactRouterNS, "default") ?? ReactRouterNS,
};

/**
 * React 19 `act` and react-dom `createRoot`.
 */
export const act = getNamed(React, "act");
export const createRoot = getNamed(reactDomClient, "createRoot");

/**
 * Returns the active React test environment, creating one on first use.
 *
 * The environment is registered under `globalThis[GLOBAL_KEY]` so the
 * JavaScript execution engine can reuse it and so standalone helpers
 * (renderReact, fireEvent, mockFetch, ...) operate against the same
 * jsdom window as any component under test.
 *
 * @returns {object} The test environment ({ dom, window, document, rootContainer }).
 */
export function getTestEnvironment() {
  if (globalThis[GLOBAL_KEY]) {
    return globalThis[GLOBAL_KEY];
  }

  if (sharedEnvironment) {
    return sharedEnvironment;
  }

  const dom = new JSDOM(
    "<!DOCTYPE html><html><head></head><body><div id=\"root\"></div></body></html>",
    { url: "http://localhost/", pretendToBeVisual: true }
  );

  const environment = {
    dom,
    window: dom.window,
    document: dom.window.document,
    rootContainer: dom.window.document.getElementById("root"),
    activeRoot: null,
    activeErrorSink: null,
  };

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.Node = dom.window.Node;

  // React's onChange polyfill (used when a text input is focused) watches
  // the active element with the legacy attachEvent/detachEvent APIs when it
  // believes the browser has no native "input" event support. jsdom lacks
  // those APIs, which would crash the event dispatch, so map them onto
  // addEventListener/removeEventListener.
  if (typeof dom.window.HTMLElement.prototype.attachEvent !== "function") {
    dom.window.HTMLElement.prototype.attachEvent = function (type, listener) {
      this.addEventListener(type.replace(/^on/i, ""), listener);
    };
    dom.window.HTMLElement.prototype.detachEvent = function (type, listener) {
      this.removeEventListener(type.replace(/^on/i, ""), listener);
    };
  }

  // React 19's act() requires this flag to be set in the environment.
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // React rethrows uncaught errors via reportError() when available
  // (instead of throwing on a timer, which would crash the test process).
  // The current error sink records them so assertions can fail with a
  // clear, learner-friendly message.
  globalThis.reportError = (error) => {
    if (environment.activeErrorSink) {
      environment.activeErrorSink.push(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  globalThis[GLOBAL_KEY] = environment;
  sharedEnvironment = environment;

  return environment;
}

/**
 * Installs an error capture sink for the duration of an assertion.
 *
 * Errors reported through React's onUncaughtError, through the global
 * reportError hook, or as window "error" events are collected so the
 * assertion can turn them into educational failure messages.
 *
 * @param {object} environment - The React test environment.
 * @returns {{ errors: Error[], done: Function }}
 */
export function captureErrors(environment) {
  const errors = [];
  environment.activeErrorSink = errors;

  const onWindowError = (event) => {
    if (event && event.error) {
      errors.push(event.error);
    }
  };
  environment.window.addEventListener("error", onWindowError);

  return {
    errors,
    done() {
      environment.window.removeEventListener("error", onWindowError);
      if (environment.activeErrorSink === errors) {
        environment.activeErrorSink = null;
      }
    },
  };
}
