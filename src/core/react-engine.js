import fs from "fs";
import path from "path";
import vm from "vm";
import { build } from "esbuild";
import {
  React,
  reactDom,
  reactDomClient,
  jsxRuntime,
  reactRouterDom,
  getTestEnvironment,
  captureErrors,
} from "../assertions/react/environment.js";
import { renderReactComponent } from "../assertions/react/render.js";
import { resolveFetchMock, createFetchResponse } from "../assertions/react/fetch.js";

/**
 * React execution environment (v1.3.0).
 *
 * React labs differ from plain JavaScript labs: student code is spread
 * across multiple JSX modules that must be resolved, transformed, and
 * executed before anything can be asserted. The engine:
 *
 *   1. Reads the lab's package.json to expose dependencies.
 *   2. Detects the project entry (src/main.jsx, src/main.js, ...).
 *   3. Bundles student files with esbuild (JSX transform, import
 *      resolution, node_modules lookup) — react, react-dom, and
 *      react-router-dom are external and supplied by the framework so
 *      every render shares a single React instance.
 *   4. Executes the bundle in a vm sandbox with a require shim.
 *   5. Renders components into a shared jsdom window through React 19's
 *      act(), flushing state updates and effects.
 *
 * Bundling is lazy and cached: assertions that only inspect files
 * (project, dependency, component, jsx) never pay for a build.
 */

const EXTERNAL_PACKAGES = [
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-router-dom",
  "scheduler",
];

const ASSET_LOADERS = {
  ".css": "empty",
  ".svg": "empty",
  ".png": "empty",
  ".jpg": "empty",
  ".jpeg": "empty",
  ".gif": "empty",
  ".webp": "empty",
  ".woff": "empty",
  ".woff2": "empty",
  ".ttf": "empty",
  ".eot": "empty",
};

const ENTRY_CANDIDATES = [
  "src/main.jsx",
  "src/main.js",
  "src/index.jsx",
  "src/index.js",
  "src/App.jsx",
  "src/App.js",
];

const DEFAULT_ENTRY_FILES = ["src/main.jsx", "src/main.js", "src/App.jsx", "src/App.js"];

const TIMEOUT_MS = 5000;

/**
 * Creates a React execution engine for a lab directory.
 *
 * @param {object} options
 * @param {string} options.labDirectory - Absolute path of the lab.
 * @param {string} [options.entry] - Entry file from learnthencode.json
 *   (relative to the lab); auto-detected when absent.
 * @returns {object} The React execution engine.
 */
export function createReactEngine({ labDirectory, entry }) {
  const packageJsonPath = path.join(labDirectory, "package.json");
  const packageJson = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
    : null;

  const dependencyNames = new Set(
    Object.keys(packageJson?.dependencies ?? {}).concat(
      Object.keys(packageJson?.devDependencies ?? {}),
      Object.keys(packageJson?.peerDependencies ?? {})
    )
  );

  const entryFile = resolveEntryFile(labDirectory, entry);

  // -------------------------------------------------------------------------
  // Shared jsdom environment + host globals (see environment.js).
  // -------------------------------------------------------------------------
  const environment = getTestEnvironment();
  environment.window.addEventListener("error", (event) => {
    if (event && event.error && environment.activeErrorSink) {
      environment.activeErrorSink.push(event.error);
    }
  });

  // -------------------------------------------------------------------------
  // vm sandbox for bundled student code.
  // -------------------------------------------------------------------------
  const fetchCalls = [];
  const consoleOutput = [];
  let fetchMocks = null;

  const sandbox = Object.assign(Object.create(null), {
    module: { exports: {} },
    exports: {},
    require: (name) => {
      switch (name) {
        case "react":
          return React;
        case "react/jsx-runtime":
        case "react/jsx-dev-runtime":
          return jsxRuntime;
        case "react-dom":
          return reactDom;
        case "react-dom/client":
          return reactDomClient;
        case "react-router-dom":
          return reactRouterDom;
        default:
          throw new Error(
            `Module "${name}" is not available in the test environment.`
          );
      }
    },
    window: environment.window,
    document: environment.document,
    navigator: environment.window.navigator,
    location: environment.window.location,
    history: environment.window.history,
    setTimeout: environment.window.setTimeout.bind(environment.window),
    setInterval: environment.window.setInterval.bind(environment.window),
    clearTimeout: environment.window.clearTimeout.bind(environment.window),
    clearInterval: environment.window.clearInterval.bind(environment.window),
    requestAnimationFrame: environment.window.requestAnimationFrame.bind(environment.window),
    cancelAnimationFrame: environment.window.cancelAnimationFrame.bind(environment.window),
    queueMicrotask: environment.window.queueMicrotask.bind(environment.window),
    Event: environment.window.Event,
    CustomEvent: environment.window.CustomEvent,
    MouseEvent: environment.window.MouseEvent,
    KeyboardEvent: environment.window.KeyboardEvent,
    FocusEvent: environment.window.FocusEvent,
    HTMLElement: environment.window.HTMLElement,
    HTMLInputElement: environment.window.HTMLInputElement,
    HTMLButtonElement: environment.window.HTMLButtonElement,
    HTMLFormElement: environment.window.HTMLFormElement,
    HTMLSelectElement: environment.window.HTMLSelectElement,
    Node: environment.window.Node,
    Element: environment.window.Element,
    localStorage: environment.window.localStorage,
    sessionStorage: environment.window.sessionStorage,
    console: {
      log: (...args) => consoleOutput.push(args.map(String).join(" ")),
      error: (...args) => consoleOutput.push(args.map(String).join(" ")),
      warn: (...args) => consoleOutput.push(args.map(String).join(" ")),
      info: (...args) => consoleOutput.push(args.map(String).join(" ")),
    },
    fetch: async (url, options = {}) => {
      const urlString = typeof url === "string" ? url : String(url);
      fetchCalls.push({
        url: urlString,
        method: (options.method || "GET").toUpperCase(),
        headers: options.headers ? { ...options.headers } : {},
        body: options.body || null,
      });
      const mock = resolveFetchMock(fetchMocks, urlString);
      return createFetchResponse(mock);
    },
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    Date,
    RegExp,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    ReferenceError,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Promise,
    Symbol,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    JSON,
    undefined: undefined,
    null: null,
  });

  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  // -------------------------------------------------------------------------
  // Lazy, cached bundling.
  // -------------------------------------------------------------------------
  const bundleCache = new Map();
  let executionError = null;

  async function buildFile(absolutePath) {
    try {
      const result = await build({
        entryPoints: [absolutePath],
        bundle: true,
        platform: "browser",
        format: "cjs",
        jsx: "automatic",
        jsxImportSource: "react",
        external: EXTERNAL_PACKAGES,
        loader: ASSET_LOADERS,
        define: {
          "import.meta.env": "{}",
          "process.env.NODE_ENV": JSON.stringify("test"),
        },
        logLevel: "silent",
        write: false,
      });
      return { code: result.outputFiles[0].text, error: null };
    } catch (e) {
      return { code: null, error: e.message };
    }
  }

  async function bundle(absolutePath) {
    if (bundleCache.has(absolutePath)) {
      return bundleCache.get(absolutePath);
    }

    const promise = (async () => {
      executionError = null;
      const { code, error } = await buildFile(absolutePath);
      if (error) {
        executionError = new Error(error);
        return null;
      }
      try {
        const moduleRecord = { exports: {} };
        sandbox.module = moduleRecord;
        sandbox.exports = moduleRecord.exports;
        const script = new vm.Script(code, {
          filename: path.basename(absolutePath),
        });
        script.runInContext(sandbox, { timeout: TIMEOUT_MS });
        return sandbox.module.exports;
      } catch (e) {
        executionError = e;
        return null;
      }
    })();

    bundleCache.set(absolutePath, promise);
    return promise;
  }

  function pickComponent(moduleExports, exportName, file) {
    if (exportName) {
      return moduleExports[exportName] ?? null;
    }
    if (typeof moduleExports.default === "function") {
      return moduleExports.default;
    }
    const base = path
      .basename(file)
      .replace(/\.(jsx|tsx|js|ts|mjs|cjs)$/i, "");
    if (typeof moduleExports[base] === "function") {
      return moduleExports[base];
    }
    const functions = Object.values(moduleExports).filter(
      (value) => typeof value === "function"
    );
    if (functions.length === 1) {
      return functions[0];
    }
    const values = Object.values(moduleExports);
    return values.length === 1 ? values[0] : null;
  }

  return {
    labDirectory,
    entryFile,
    packageJson,
    environment,
    consoleOutput,

    // -----------------------------------------------------------------------
    // Project inspection (used by static assertions).
    // -----------------------------------------------------------------------

    get packageJsonPresent() {
      return packageJson !== null;
    },

    resolve(relativePath) {
      return path.resolve(labDirectory, relativePath);
    },

    fileExists(relativePath) {
      return fs.existsSync(path.resolve(labDirectory, relativePath));
    },

    readFile(relativePath) {
      return fs.readFileSync(path.resolve(labDirectory, relativePath), "utf-8");
    },

    hasDependency(name) {
      return dependencyNames.has(name);
    },

    getDependencyNames() {
      return dependencyNames;
    },

    getProjectTooling() {
      const devDependencies = packageJson?.devDependencies ?? {};
      if (devDependencies.vite) {
        return "vite";
      }
      if (devDependencies["react-scripts"]) {
        return "cra";
      }
      return null;
    },

    detectEntryFile() {
      for (const candidate of ENTRY_CANDIDATES) {
        if (fs.existsSync(path.resolve(labDirectory, candidate))) {
          return candidate;
        }
      }
      return null;
    },

    // -----------------------------------------------------------------------
    // Bundling (used by jsx, component, and render assertions).
    // -----------------------------------------------------------------------

    buildFile,
    bundle,
    get executionError() {
      return executionError;
    },

    /**
     * Loads and executes a component file and returns its component.
     *
     * @param {object} options
     * @param {string} options.file - Component file relative to the lab.
     * @param {string} [options.exportName] - Named export to use.
     * @returns {Promise<{ component: Function, error: string|null }>}
     */
    async getComponent({ file, exportName }) {
      const absolutePath = path.resolve(labDirectory, file);
      if (!fs.existsSync(absolutePath)) {
        return {
          component: null,
          error: `Component file "${file}" was not found in the lab. Create it before testing this requirement.`,
        };
      }

      const moduleExports = await bundle(absolutePath);
      if (executionError) {
        return {
          component: null,
          error: `Loading "${file}" caused an error: ${executionError.message}`,
        };
      }

      const component = pickComponent(moduleExports, exportName, file);
      if (!component) {
        const base = path
          .basename(file)
          .replace(/\.(jsx|tsx|js|ts|mjs|cjs)$/i, "");
        return {
          component: null,
          error: `Component "${file}" does not export a component. Add a default export (e.g. "export default function ${base}()") or use "exportName".`,
        };
      }
      if (typeof component !== "function") {
        return {
          component: null,
          error: `The export from "${file}" is not a component. A React component must be a function.`,
        };
      }

      return { component, error: null };
    },

    /**
     * Renders a component file into the shared test container.
     *
     * @param {object} options
     * @param {string} options.file - Component file relative to the lab.
     * @param {string} [options.exportName] - Named export to use.
     * @param {object} [options.props] - Props passed to the component.
     * @param {object} [options.router] - { path } to wrap the component in
     *   a MemoryRouter (route/navigate assertions).
     * @returns {Promise<{ container: Element, errors: Error[], error: string|null, capture: object }>}
     */
    async renderComponent({ file, exportName, props, router }) {
      const { component, error } = await this.getComponent({ file, exportName });
      if (error) {
        return { container: null, errors: [], error, capture: null };
      }

      let renderable = component;
      if (router) {
        renderable = function RoutedApp(routerProps) {
          return React.createElement(
            reactRouterDom.MemoryRouter,
            { initialEntries: [router.path] },
            React.createElement(component, routerProps)
          );
        };
      }

      const capture = captureErrors(environment);
      const rendered = await renderReactComponent(
        renderable,
        props,
        environment
      );

      if (rendered.errors.length > 0) {
        return {
          container: null,
          errors: rendered.errors,
          error: rendered.errors[0].message,
          capture,
        };
      }

      return {
        container: rendered.container,
        errors: rendered.errors,
        error: null,
        capture,
      };
    },

    // -----------------------------------------------------------------------
    // Fetch mocking (used by effect and fetch assertions).
    // -----------------------------------------------------------------------

    setFetchMocks(mocks) {
      fetchMocks = mocks || null;
    },

    get fetchCalls() {
      return fetchCalls;
    },
  };
}

/**
 * Resolves the project entry file.
 *
 * The lab's `entry` field wins when it points to an existing file;
 * otherwise common Vite/CRA entry files are probed in order.
 *
 * @param {string} labDirectory
 * @param {string|undefined} entry - Entry from learnthencode.json.
 * @returns {string|null} Relative entry path, or null.
 */
function resolveEntryFile(labDirectory, entry) {
  if (entry && fs.existsSync(path.resolve(labDirectory, entry))) {
    return entry;
  }
  for (const candidate of DEFAULT_ENTRY_FILES) {
    if (fs.existsSync(path.resolve(labDirectory, candidate))) {
      return candidate;
    }
  }
  return null;
}
