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
      -> src/core/runner.js (main orchestration)
        -> src/core/lab.js (load & validate lab config)
        -> src/providers/local-provider.js (find private-tests/requirements.json)
        -> src/core/load-requirements.js (read & validate requirements)
        -> src/core/load-html.js (read learner entry file)
        -> src/core/js-execution-engine.js (create JS sandbox if needed, v1.2.0)
        -> src/core/execute-requirements.js (run each assertion)
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
                -> javascript/functions.js
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

## Assertion Registry

Assertions are registered in `src/assertions/index.js` under the `assertions` map. The `check.type` field in requirements.json selects which assertion to execute.

HTML assertions use types like `element`, `attribute`, `text`, `count`, `semantic`, `structure`.

CSS assertions use `type: "css"` and dispatch to sub-modules based on `check.assertion`, `check.property`, or `check.styles` fields.

JavaScript assertions (v1.2.0) use dedicated types: `variable`, `function`, `array`, `object`, `dom`, `event`, `fetch`, `json`. Each type maps to its own module in `src/assertions/javascript/`.

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
