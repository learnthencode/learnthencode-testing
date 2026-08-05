# Architecture

## Overview

LearnThenCode Testing Framework validates student lab submissions against declarative requirements. It supports HTML, CSS, and JavaScript assertion types through a modular, pluggable architecture.

## Pipeline

```
CLI (bin/learnthencode-test.js)
  -> src/cli/index.js (start)
    -> src/cli/parser.js (parse arguments)
    -> src/cli/commands.js (route command)
      -> src/core/detect-lab.js (find learnthencode.json in cwd)
        -> src/core/runner.js (main orchestration, awaits async results since v1.2.1)
        -> src/core/lab.js (load & validate lab config)
        -> src/providers/local-provider.js (find private-tests/requirements.json)
        -> src/core/load-requirements.js (read & validate requirements)
        -> src/core/load-html.js (read learner entry file)
        -> src/core/js-execution-engine.js (create JS engine when JS assertions exist; HTML entries always create a jsdom instance, v1.2.3)
        -> src/core/execute-requirements.js (run each assertion; may return a Promise)
          -> For HTML assertions: Cheerio parses HTML -> assertion function
          -> For CSS assertions: jsdom renders HTML+CSS -> computed style check
          -> For JS assertions: sandboxed vm context -> state inspection
            -> src/assertions/index.js (lookup assertion by type)
              -> elements.js / attributes.js / count.js / text.js / semantic.js / structure.js
              -> css/index.js (dispatches to sub-modules)
                -> css/base.js (toHaveCSS, toHaveStyles)
                -> css/flexbox.js / css/grid.js / css/typography.js
                -> css/colors.js / css/spacing.js / css/layout.js
                -> css/borders.js / css/visibility.js
              -> javascript/index.js (dispatches to JS sub-modules, v1.2.0)
                -> javascript/variables.js
                -> javascript/functions.js (dispatches async assertions to async.js, v1.2.1)
                -> javascript/async.js (async assertions, v1.2.1)
                -> javascript/arrays.js
                -> javascript/objects.js
                -> javascript/dom.js
                -> javascript/events.js
                -> javascript/fetch.js
                -> javascript/json.js
            -> src/assertions/expect.js (wrap result)
          -> src/core/results.js (createResult / createResultCollection)
        -> src/reporter/console-reporter.js (print formatted output)
          -> src/reporter/colors.js (ANSI coloring)
```

## CSS Rendering

CSS assertions use jsdom to render the HTML with full CSS support:

1. HTML is parsed by jsdom (simulating a browser environment)
2. External stylesheets (`<link rel="stylesheet">`) are loaded from disk
3. Embedded `<style>` blocks are applied
4. Inline `style` attributes are applied
5. `window.getComputedStyle(element)` returns the final computed style

This approach validates the actual rendered output, accounting for:
- Inheritance
- Shorthand property expansion
- CSS cascade and specificity
- Media queries (via viewport switching)
- Browser default styles

## JavaScript Execution Engine (v1.2.0)

JavaScript assertions evaluate student code in a sandboxed environment:

1. A `jsdom` window is created with a minimal HTML document (or loaded from the lab's entry file)
2. A Node.js `vm` context is created with the jsdom window as its global object
3. Browser APIs (`document`, `window`, `addEventListener`, etc.) are provided from jsdom
4. `fetch` is replaced with a mock that records calls (no real network requests)
5. `JSON.parse` and `JSON.stringify` are intercepted to track usage
6. `console.log` output is captured for inspection
7. Student code is executed via `vm.Script.runInContext()` with a 5-second timeout

After execution, the engine exposes:
- `getValue(expr)` — evaluates an expression in the sandbox and returns `{ exists, value }`
- `evaluate(expr)` — evaluates an expression directly
- `fetchCalls` — array of recorded fetch calls
- `jsonParseCalls` / `jsonStringifyCalls` — recorded JSON method calls
- `consoleOutput` — captured console output
- `document` — the jsdom document (for DOM assertions)
- `listenerRegistry` — recorded student event listeners
- `getListeners(target, eventType)` — listeners recorded for a specific target/event pair

### Event Listener Tracking (v1.2.4)

Browsers do not expose registered listeners, so `events` assertions need their own tracking. `js-execution-engine.js` intercepts `addEventListener` and `removeEventListener` on the shared `EventTarget.prototype` — every target (window, document, elements) inherits from it, so one patch covers all of them. Records are `{ target, event, callback }` and live only inside the test environment; student code is never modified.

Only callbacks created inside the student's `vm` realm are tracked. jsdom's internal machinery (for example the `@asamuzakjp/dom-selector` engine, which lazily registers window listeners on the first selector query) registers host-realm functions, and those would pollute the registry — the realm check (`callback.constructor !== Function`) keeps the registry limited to listeners the student actually registered. A matching `removeEventListener` call removes the record, so `listenerExists` fails after a listener has been removed.

## HTML Entry Execution (v1.2.3)

DOM assertions and every other JavaScript assertion type execute against the **same jsdom instance** that ran the student's scripts. The execution lifecycle for an HTML entry (`"entry": "starter/index.html"`) is:

1. `runner.js` reads the entry HTML and checks the requirements for any JavaScript assertion type (`variable`, `function`, `array`, `object`, `dom`, `event`, `events`, `fetch`, `json`, `console`) via the shared registry in `src/constants/assertion-types.js`. If at least one exists, the engine is always initialized — even when the HTML contains no scripts at all.
2. `createJSEngineFromHTML()` (in `js-execution-engine.js`) loads the HTML into a single `JSDOM` instance. The engine exposes a browser-like sandbox: `window`, `document`, `HTMLElement`, `Element`, `Node`, `Event`, `CustomEvent`, `navigator`, `localStorage`, `sessionStorage`, plus timers, events, the mocked `fetch`, intercepted `JSON`, and captured `console`.
3. `extractScriptCode()` walks `<script>` tags in document order. Linked scripts (`src`) are resolved relative to the HTML file and read from disk; inline scripts are collected as-is. Empty script tags are skipped.
4. The combined script code executes **exactly once** in a Node `vm` context over the jsdom window. All scripts share one global scope, preserving browser-like declaration order.
5. Assertions run against the engine: DOM assertions (`dom`, `event`, `events`) query the live `document`; `variable`/`function`/`array`/`object` inspect the sandbox; `fetch`/`json`/`console` read the recorded calls and output. No second DOM or second engine is created.
6. A runtime error in student code is captured on the engine (`executionError`); every JS assertion then fails with a "JavaScript error prevented evaluation" result instead of crashing the run.

Pure HTML labs without JavaScript assertions never create an engine — they continue to parse with Cheerio exactly as before.

## Asynchronous JavaScript Execution (v1.2.1)

Async support extends the existing `function` assertion type. When `check.assertion` is one of `returnsPromise`, `resolves`, `rejects`, or `rejectsWith`, `javascript/functions.js` delegates to `javascript/async.js` instead of running the synchronous return-value check.

### Execution Flow

1. The assertion resolves the named function via `engine.getValue(name)`.
2. The function is called with `check.args` (defaults to `[]`).
3. The returned value must be a Promise (`then` + `catch` callables) — otherwise the assertion fails with a clear "must return a Promise" message. A synchronous throw is reported as a failure, never treated as a rejection.
4. `returnsPromise` stops here and passes.
5. For `resolves`, `rejects`, and `rejectsWith`, the Promise is awaited through `withTimeout()`.
6. The settled outcome is compared:
   - `resolves` — deep equality via `src/utils/deep-equal.js` (primitives, objects, arrays at any depth; prototypes are ignored so sandbox values compare correctly against plain JSON expectations).
   - `rejects` — any rejection passes.
   - `rejectsWith` — the rejection message (via `reason.message` when present) must equal `check.value`.

### Promise Handling

Promises created inside the `vm` sandbox are native promises (the sandbox exposes the host `Promise`), so `await` works across the sandbox boundary with no special bridging. Values that cross the boundary are compared with `deepEqual`, which deliberately ignores prototypes so object literals produced in the sandbox match JSON values from the requirements file.

### Timeout Handling

Every awaited assertion is raced against a timeout so a promise that never settles cannot hang a test run:

- Default timeout: `3000ms`, defined in `src/constants/async.js` (`ASYNC_TIMEOUT_MS`). Because it lives in a constants module, future framework versions can change it without altering any assertion schema.
- `src/utils/async.js` provides `withTimeout(promise, ms)` and `AsyncTimeoutError`.
- The timer is cleared as soon as the promise settles, and late rejections (after the timeout already fired) are neutralized so they never surface as unhandled promise rejections.
- Timeouts fail with a learner-friendly message: `Function "name" did not settle within 3000ms. Make sure it returns a Promise that resolves or rejects.`

### Execution Lifecycle

`src/core/runner.js` is the only lifecycle owner:

1. `run(labDirectory)` is now `async` and `await`s the outcome of every requirement.
2. `executeRequirement` returns a plain result object for synchronous assertions and a `Promise` for asynchronous ones — callers that only use synchronous assertions see no API change.
3. Synchronous and asynchronous assertions can therefore coexist in the same requirements file; the runner awaits each result before moving to the next, preserving deterministic order.
4. The CLI (`src/cli/commands.js`) awaits `run()` before reporting.

### React Component Testing (v1.3.0)

`src/core/react-engine.js` is a second execution engine built on top of the async lifecycle:

- **Bundling** — student `.jsx` files are bundled with esbuild (`format: "cjs"`, `platform: "browser"`, `jsx: "automatic"`). `react`, `react-dom`, `react-dom/client`, `react/jsx-runtime`, and `react-router-dom` are external; css/svg/png/etc. get empty loaders. Bundles are cached by absolute path.
- **Sandbox execution** — the bundle runs in a `vm` context whose `require` shim serves the host's real React/react-dom/react-router-dom instances (host-realm modules, same approach as react-testing-library). `window`, `document`, `navigator`, `HTMLElement`, `Element`, and `Node` are installed as host globals before rendering; `IS_REACT_ACT_ENVIRONMENT = true` enables React 19's `act()`.
- **Rendering** — `renderComponent` resolves the export (`getComponent`), wraps it in a `MemoryRouter` when the check asks for routing, and renders inside `act()` (`src/assertions/react/render.js`). A component that throws while rendering is captured (act rethrows it, the try/catch converts it to `{ container: null, error }`) instead of crashing the run. A `reportError` sink and window "error" listener collect async failures.
- **Interactions** — `src/assertions/react/fire.js` simulates clicks, typing, selection, submit, and reset inside `act()`. Controlled inputs follow React 19's change-event machinery: a `focusin` dispatch makes the input React's active element, the native value setter updates the DOM value, and a `keydown` dispatch triggers the change handler through the input-event polyfill. jsdom's missing `attachEvent`/`detachEvent` (used by React's value-change watcher) is shimmed onto `HTMLElement.prototype` in `environment.js`.
- **Fetch mocking** — `src/assertions/react/fetch.js` intercepts `window.fetch` for the sandbox. Mocks are installed *before* `renderComponent` so `useEffect` fetches issued during the render flush hit the mock. Routes match exactly, then by longest substring, then `"*"` catch-all; scenarios are `success`/`error`/`empty`/`loading`; unmatched URLs resolve to a successful empty response so components render their fallback state.
- **Dispatch** — requirements with `"type": "react"` are routed by `check.subtype` through `reactAssertions` (`src/assertions/react/index.js`), a separate map from the generic `assertions` map (generic `count`/`fetch` keys would collide). The runner creates the React engine when any requirement has a React type, regardless of the entry extension.

## Assertion Registry

Assertions are registered in `src/assertions/index.js` under the `assertions` map. The `check.type` field in requirements.json selects which assertion to execute.

The set of JavaScript, CSS, and React types is defined once in `src/constants/assertion-types.js`. `execute-requirements.js`, `runner.js`, and `validate-requirement.js` all import from it, so registering a new type there automatically makes the runner initialize the matching engine when any requirement uses it.

HTML assertions use types like `element`, `attribute`, `text`, `count`, `semantic`, `structure`.

CSS assertions use `type: "css"` and dispatch to sub-modules based on `check.assertion`, `check.property`, or `check.styles` fields.

JavaScript assertions (v1.2.0, async extensions v1.2.1, HTML entry execution v1.2.3, events v1.2.4) use dedicated types: `variable`, `function`, `array`, `object`, `dom`, `event`, `events`, `fetch`, `json`, `console`. Each type maps to its own module in `src/assertions/javascript/`. The `events` type dispatches to `javascript/events.js`, which also exports the legacy `event` assertion so both types stay registered in `javascript/index.js`.

React assertions (v1.3.0, source analysis v1.3.1) use `type: "react"` and dispatch to `src/assertions/react/index.js` by `check.subtype` (40 subtypes covering render checks, interactions, effects/fetch, routing, and static source analysis). Validation lives in `validateReactRequirement` (`src/core/validate-requirement.js`), which shares the field conventions of the other types.

### React Source Analysis (v1.3.1)

v1.3.1 adds ten static subtypes — `effect`, `dependencyArray`, `cleanup`, `customHook`, `imports`, `fileExists`, `folderExists`, `route`, `routeParam`, `navLink` — that assess the remaining React labs (effects, API integration, router, custom hooks, project architecture) without bundling or rendering.

- **AST parsing** — `src/assertions/react/ast.js` wraps `@babel/parser` (`sourceType: "module"`, `jsx` plugin) and `@babel/traverse`. `parseSource()` never throws: parse failures are returned as `{ ast: null, error }` so assertions produce descriptive failure messages. Helpers cover imports (`getImportSources`, `importsModule`, `importsName`), hook calls (`findHookCalls`, `findUseEffectCalls`, `getHookName` — accepts both `useEffect(...)` and `React.useEffect(...)`), effect shape (`hasDependencyArray`, `hasCleanup`), exports (`getExportedFunctions`), JSX (`findJsxElements`, `getJsxAttribute`), and subtree scans (`callsAHook` — a manual recursive walk because Babel 8's `traverse()` requires scope/parentPath outside a Program).
- **Assertions** — `src/assertions/react/ast-assertions.js` implements the ten subtypes with the standard `(engine, requirement) => result` signature. Only `engine.fileExists`, `engine.readFile`, `engine.resolve`, and the new `engine.directoryExists` are used; no bundling occurs. The engine's `directoryExists()` (`src/core/react-engine.js`) uses `fs.statSync` so `folderExists` rejects file paths.
- **Validation** — `src/core/validate-requirement.js` registers the subtypes in `REACT_ASSERTION_SUBTYPES`; nine of them join `COMPONENT_REQUIRED_SUBTYPES`. `imports` requires a non-empty string `expect` array, `route`/`routeParam` require a non-empty string `path`, `navLink` requires a non-empty string `expect`, and `fileExists`/`folderExists` require a non-empty string `path` (they are the only new subtypes that do not take a `component`).
- **Why an AST** — source assertions never match on strings or regular expressions, so reformatting student code (whitespace, quotes, line breaks) cannot change results. New static checks are added by writing new helpers in `ast.js` rather than new regexes.
- **Tests** — `tests/react-effects.test.js`, `tests/react-custom-hooks.test.js`, `tests/react-router-advanced.test.js`, and `tests/react-project-structure.test.js` cover passing, failing, validation, and full-runner integration cases. `tests/helpers/react-lab-fixtures.js` holds the shared fixtures (`EFFECT_APP_JSX`, `CUSTOM_HOOK_JSX`, `IMPORTS_APP_JSX`, `ROUTED_NAVLINK_APP_JSX`, and failure variants).

## Value Normalization

Before comparison, CSS values are normalized:

- Colors: named, hex, rgb() all converted to lowercase hex
- Font weights: named values (bold, normal) mapped to numeric
- Whitespace trimmed, case lowered
- `!important` removed

## Extending

To add a new assertion type:
1. Create the assertion function in `src/assertions/` (or `src/assertions/css/` for CSS, or `src/assertions/javascript/` for JS)
2. Register it in `src/assertions/index.js`
3. Add validation in `src/core/validate-requirement.js` if needed
4. Create tests in `tests/`

To add a new language (e.g. React):
1. Create the execution environment in a new engine module in `src/core/`
2. Create assertion modules in `src/assertions/<language>/`
3. Register types in `src/assertions/index.js`
4. Add routing in `src/core/execute-requirements.js`
5. Update the runner in `src/core/runner.js` to set up the environment
6. Add validation rules in `src/core/validate-requirement.js`
