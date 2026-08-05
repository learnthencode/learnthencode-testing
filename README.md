# learnthencode-testing

> A lightweight HTML, CSS, and JavaScript testing framework for the [LearnThenCode](https://learnthencode.com) Full Stack Software Engineering Bootcamp.

`learnthencode-testing` provides a declarative, JSON-driven way to validate learner HTML, CSS, and JavaScript submissions against a set of requirements. It ships with a CLI, a rich set of built-in assertion types, and a color-coded console reporter designed for an educational environment.

For HTML labs, the framework uses [Cheerio](https://cheerio.js.org/) to parse and query the DOM. For CSS labs, it uses [jsdom](https://github.com/jsdom/jsdom) to render the HTML, load stylesheets, apply styles, and validate **computed styles** — giving accurate pass/fail feedback that matches what the learner sees in the browser. For JavaScript labs, it uses a sandboxed execution engine built on Node.js `vm` and `jsdom` to safely evaluate student code and inspect variables, functions, arrays, objects, DOM manipulation, events, fetch calls, and JSON operations. HTML entries that contain JavaScript assertions are loaded into the same jsdom environment, so scripts run exactly as they would in a browser before any assertion is evaluated (v1.2.3).

---

## Table of Contents

- [Installation](#installation)
- [How It Works](#how-it-works)
- [CLI Usage](#cli-usage)
- [Lab Configuration](#lab-configuration)
- [Requirements File](#requirements-file)
  - [Assertion Types](#assertion-types)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

Install globally to use the CLI from anywhere:

```bash
npm install -g learnthencode-testing
```

Or install locally inside a bootcamp workspace:

```bash
npm install learnthencode-testing
```

---

## How It Works

The framework operates around the concept of a **lab** — a directory containing a learner's work alongside a configuration file. When you run `learnthencode-test run`, the framework:

1. **Detects** the lab by looking for `learnthencode.json` in the current directory.
2. **Loads** the lab's entry file (HTML or JavaScript).
3. **Discovers** the hidden `requirements.json` from the `private-tests` directory (one level up from the lab).
4. **Executes** each requirement's assertion — HTML assertions use [Cheerio](https://cheerio.js.org/) to parse the DOM, CSS assertions render with [jsdom](https://github.com/jsdom/jsdom) and validate computed styles, and JavaScript assertions evaluate code in a sandboxed execution environment.
5. **Reports** pass/fail results, hints, score, and percentage to the console.

```
my-bootcamp/
├── private-tests/
│   └── requirements.json       ← Hidden test file (managed by instructors)
└── html-headings/              ← Lab directory (learner's workspace)
    ├── learnthencode.json      ← Lab configuration
    └── starter/
        └── index.html          ← Learner's submission
```

---

## CLI Usage

Run tests from inside a lab directory:

```bash
learnthencode-test run
```

Display help information:

```bash
learnthencode-test --help
```

Display the current version:

```bash
learnthencode-test --version
```

### Example Output

```
========================================
 LearnThenCode Testing Framework
 Version 1.3.1
========================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 LearnThenCode Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✔ Page contains exactly one heading

✘ Navigation contains correctly nested links
  Could not find required structure "nav > ul > li > a".
  Hint: Use the structure nav > ul > li > a.

Passed: 1
Failed: 1

Score: 5/10
Percentage: 50%
```

---

## Lab Configuration

Each lab must have a `learnthencode.json` file in its root directory.

```json
{
  "id": "html-headings",
  "title": "HTML Headings",
  "lesson": "lesson-01",
  "language": "html",
  "entry": "starter/index.html",
  "version": "1.0.0"
}
```

| Field      | Type     | Required | Description                                                  |
| ---------- | -------- | -------- | ------------------------------------------------------------ |
| `id`       | `string` | ✅        | Unique identifier for the lab.                               |
| `title`    | `string` | ✅        | Human-readable title of the lab.                             |
| `lesson`   | `string` | ✅        | The lesson this lab belongs to.                              |
| `language` | `string` | ✅        | The primary language being tested (e.g. `"html"`).           |
| `entry`    | `string` | ✅        | Relative path to the HTML file to test.                      |
| `version`  | `string` | ✅        | Version of the lab configuration.                            |

---

## Requirements File

The hidden `requirements.json` (located in `private-tests/requirements.json`, one level above the lab) defines the assertions that will be run against the learner's submission.

```json
{
  "requirements": [
    {
      "id": "html-001",
      "name": "Page contains exactly one heading",
      "description": "Use one h1 element.",
      "hint": "Every page should have one primary heading.",
      "points": 5,
      "check": {
        "type": "count",
        "selector": "h1",
        "equals": 1
      }
    }
  ]
}
```

### Requirement Fields

| Field         | Type     | Required | Description                                         |
| ------------- | -------- | -------- | --------------------------------------------------- |
| `id`          | `string` | —        | Unique identifier for the requirement.              |
| `name`        | `string` | ✅        | Short label shown in the test report.               |
| `description` | `string` | —        | Longer description of what is being checked.        |
| `hint`        | `string` | —        | Guidance shown to the learner on failure.           |
| `points`      | `number` | ✅        | Points awarded when this requirement passes.        |
| `check`       | `object` | ✅        | The assertion configuration (see below).            |

---

### Assertion Types

All assertions are configured via the `check` object on each requirement. The `"selector"` field accepts any standard CSS selector, processed by [Cheerio](https://cheerio.js.org/).

---

#### `element` — Element Exists

Passes if at least one element matching the selector is found.

```json
{
  "type": "element",
  "selector": "h1"
}
```

---

#### `attribute` — Attribute Exists or Matches

Passes if the element has the specified attribute. Optionally validates the attribute's value with `equals` or `contains`.

```json
{
  "type": "attribute",
  "selector": "a",
  "attribute": "href"
}
```

With exact value match:

```json
{
  "type": "attribute",
  "selector": "html",
  "attribute": "lang",
  "equals": "en"
}
```

With partial value match:

```json
{
  "type": "attribute",
  "selector": "link",
  "attribute": "href",
  "contains": "styles.css"
}
```

---

#### `semantic` — Semantic Element(s) Exist

Checks for one or more semantic HTML5 elements.

Single element:

```json
{
  "type": "semantic",
  "selector": "main"
}
```

Multiple elements (all must be present):

```json
{
  "type": "semantic",
  "elements": ["header", "main", "footer"]
}
```

---

#### `text` — Text Content

Passes if the element's text content contains or equals the expected string.

Partial match:

```json
{
  "type": "text",
  "selector": "h1",
  "contains": "LearnThenCode"
}
```

Exact match:

```json
{
  "type": "text",
  "selector": "title",
  "equals": "My Portfolio"
}
```

Case-insensitive:

```json
{
  "type": "text",
  "selector": "h1",
  "contains": "hello",
  "caseSensitive": false
}
```

---

#### `count` — Element Count

Validates the number of elements matching the selector.

Exact count:

```json
{
  "type": "count",
  "selector": "h1",
  "equals": 1
}
```

Minimum count:

```json
{
  "type": "count",
  "selector": "li",
  "minimum": 3
}
```

Maximum count:

```json
{
  "type": "count",
  "selector": "h1",
  "maximum": 1
}
```

---

#### `structure` — Nested Structure Exists

Passes if elements matching the full CSS selector chain are found. Useful for enforcing correct HTML nesting.

```json
{
  "type": "structure",
  "selector": "nav > ul > li > a"
}
```

---

#### `css` — CSS Computed Style Assertion

Validates the **final rendered CSS** of an element using the browser's computed style API (via [jsdom](https://github.com/jsdom/jsdom)). This approach ensures inheritance, shorthand properties, external stylesheets, inline styles, and CSS variables all work correctly.

Unlike HTML assertions that inspect the DOM structure, CSS assertions load the HTML, load linked stylesheets, apply embedded `<style>` blocks, apply inline styles, render the DOM, and read computed styles.

> **Important:** CSS assertions require the lab directory so external stylesheets can be resolved from disk.

---

##### Single Property Assertion

Passes if the element's computed value for the specified CSS property matches the expected value.

```json
{
  "type": "css",
  "selector": "h1",
  "property": "color",
  "value": "red"
}
```

Property names can use either kebab-case or camelCase:

```json
{
  "type": "css",
  "selector": ".container",
  "property": "justifyContent",
  "value": "center"
}
```

##### Grouped Styles Assertion

Passes if all specified CSS properties match their expected values:

```json
{
  "type": "css",
  "selector": ".container",
  "styles": {
    "display": "flex",
    "justifyContent": "center",
    "alignItems": "center"
  }
}
```

##### Specialized Assertions

Use the `assertion` field for higher-level checks.

**Flexbox:**

```json
{
  "type": "css",
  "selector": ".container",
  "assertion": "flexbox"
}
```

**CSS Grid:**

```json
{
  "type": "css",
  "selector": ".grid-container",
  "assertion": "grid"
}
```

##### Property-Specific Checks

You can also pass specific properties directly in the assertion:

```json
{
  "type": "css",
  "selector": ".btn",
  "assertion": "visibility",
  "property": "display",
  "value": "none"
}
```

---

##### Value Normalization

CSS values are normalized before comparison. This means the following color formats are treated as equivalent:

- `red`, `#ff0000`, `rgb(255, 0, 0)` → all match

Font weights are also normalized:

- `bold` ↔ `700`
- `normal` ↔ `400`

Case differences and extra whitespace are ignored.

---

##### What Gets Validated

The framework validates **computed styles** — the actual rendered CSS after:

- External stylesheet loading (`<link rel="stylesheet">`)
- Embedded `<style>` blocks
- Inline `style` attributes
- CSS inheritance
- Shorthand property expansion
- Browser default styles

This gives accurate pass/fail feedback that matches what the learner sees in the browser.

---

##### CSS Lab Configuration

CSS labs use the same `learnthencode.json` format as HTML labs:

```json
{
  "id": "css-styling",
  "title": "CSS Styling",
  "lesson": "lesson-02",
  "language": "css",
  "entry": "starter/index.html",
  "version": "1.0.0"
}
```

The `language` field should be set to `"css"`.

---

##### Responsive Testing

The framework supports viewport switching for responsive design testing. Use the `viewport` field to specify the viewport dimensions:

```json
{
  "type": "css",
  "selector": ".navbar",
  "property": "flex-direction",
  "value": "column",
  "viewport": { "width": 375, "height": 667 }
}
```

This allows you to validate that CSS media queries produce the correct styles at different screen sizes.

---

---

### JavaScript Assertions

JavaScript assertions validate student JavaScript code by evaluating it in a sandboxed [Node.js `vm`](https://nodejs.org/api/vm.html) context with a [jsdom](https://github.com/jsdom/jsdom) browser environment. This provides:

- Access to browser APIs (`document`, `window`, `fetch`, etc.)
- Mock `fetch` that records calls for later inspection (no real network requests)
- Intercepted `JSON.parse` / `JSON.stringify` for usage verification
- Console output capture
- Support for `let`, `const`, and `var` declarations

#### `variable` — Variable Exists or Has Value

Passes if the named variable exists in the global scope.

```json
{
  "type": "variable",
  "name": "username"
}
```

With exact value check:

```json
{
  "type": "variable",
  "name": "age",
  "value": 25
}
```

Works with `let`, `const`, and `var` declarations.

---

#### `function` — Function Exists or Returns Correct Value

Passes if the named function exists and optionally returns the expected value.

```json
{
  "type": "function",
  "name": "greet"
}
```

With return value check (calls the function with provided arguments):

```json
{
  "type": "function",
  "name": "add",
  "args": [2, 3],
  "returns": 5
}
```

With parameter count check:

```json
{
  "type": "function",
  "name": "greet",
  "hasParams": true
}
```

Works with both regular functions and arrow functions.

---

#### `function` — Async Assertions (v1.2.1)

The `function` assertion type also supports asynchronous JavaScript. Each async assertion calls the named function, awaits the returned Promise (when one is returned), and applies a timeout so tests never hang forever.

> **Timeout:** If a Promise never settles, the assertion fails after **3000 milliseconds** by default with a learner-friendly message. The default is configured internally in `src/constants/async.js` so future framework versions can adjust it without changing any assertion schema.

##### `returnsPromise` — Function Returns a Promise

Passes only if calling the function returns a Promise (including async functions).

```json
{
  "type": "function",
  "assertion": "returnsPromise",
  "name": "getData"
}
```

##### `resolves` — Promise Resolves to Expected Value

Calls the function, awaits the returned Promise, and compares the resolved value. Primitive values, objects, and arrays are compared with deep equality.

```json
{
  "type": "function",
  "assertion": "resolves",
  "name": "getData",
  "value": "Hello"
}
```

With an object value:

```json
{
  "type": "function",
  "assertion": "resolves",
  "name": "getData",
  "value": {
    "id": 1,
    "name": "John"
  }
}
```

With an array value:

```json
{
  "type": "function",
  "assertion": "resolves",
  "name": "getData",
  "value": [1, 2, 3]
}
```

##### `rejects` — Promise Rejects

Passes only when the Promise rejects.

```json
{
  "type": "function",
  "assertion": "rejects",
  "name": "getData"
}
```

##### `rejectsWith` — Promise Rejects with Expected Message

Passes only when the Promise rejects with the expected error message.

```json
{
  "type": "function",
  "assertion": "rejectsWith",
  "name": "getData",
  "value": "Network Error"
}
```

All async assertions also support `args` for passing arguments to the function being tested:

```json
{
  "type": "function",
  "assertion": "resolves",
  "name": "fetchPage",
  "args": [2],
  "value": "Page 2"
}
```

Notes:

- Async assertions work with regular functions, async functions, and any function that returns a Promise.
- A synchronous throw or a non-Promise return value produces a clear failure message rather than a crash.
- A synchronous throw is **not** treated as a Promise rejection.
- Synchronous and asynchronous assertions can be mixed freely within the same requirements file and the same test run.
- Function assertions with any other `assertion` value (e.g. `"exists"`) — or none at all — behave exactly as in v1.2.0: the field is preserved for the synchronous `function` assertion (existence, `args` + `returns`, `hasParams`).

---

#### `array` — Array Exists, Has Length, or Contains Values

Passes if the named variable is an array and optionally matches length/content constraints.

```json
{
  "type": "array",
  "name": "fruits"
}
```

With length check:

```json
{
  "type": "array",
  "name": "fruits",
  "length": 3
}
```

With content check:

```json
{
  "type": "array",
  "name": "fruits",
  "contains": ["apple", "banana"]
}
```

---

#### `object` — Object Exists, Has Property, or Has Property Value

Passes if the named variable is a plain object and optionally has the specified property/value.

```json
{
  "type": "object",
  "name": "person"
}
```

With property check:

```json
{
  "type": "object",
  "name": "person",
  "property": "name"
}
```

With property value check:

```json
{
  "type": "object",
  "name": "person",
  "property": "age",
  "value": 30
}
```

---

#### `dom` — DOM State After JavaScript Execution

Validates the state of the DOM after JavaScript has executed. DOM assertions query the **live jsdom document** shared with the JavaScript execution engine — the exact same instance the student's scripts ran against (v1.2.3). Useful for testing DOM manipulation.

```json
{
  "type": "dom",
  "assertion": "elementExists",
  "selector": ".dynamic"
}
```

Other supported assertions:

```json
{
  "type": "dom",
  "assertion": "textUpdated",
  "selector": "#output",
  "value": "Success"
}
```

```json
{
  "type": "dom",
  "assertion": "classAdded",
  "selector": "#box",
  "className": "active"
}
```

```json
{
  "type": "dom",
  "assertion": "classRemoved",
  "selector": "#box",
  "className": "hidden"
}
```

| Assertion         | Description                                      | Required Fields                |
| ----------------- | ------------------------------------------------ | ------------------------------ |
| `elementExists`   | Element matching selector exists in the DOM      | `selector`                     |
| `elementCreated`  | Element with tagName or selector was created      | `tagName` or `selector`        |
| `elementRemoved`  | Element matching selector no longer exists        | `selector`                     |
| `textUpdated`     | Element's textContent matches expected value      | `selector`, `value`            |
| `classAdded`      | Element has the specified class                   | `selector`, `className`        |
| `classRemoved`    | Element does not have the specified class         | `selector`, `className`        |

---

#### `event` — Event Handler Verification

Dispatches a DOM event on the specified element and checks for an observable effect.

```json
{
  "type": "event",
  "assertion": "click",
  "selector": "#myButton",
  "effect": {
    "target": "#output",
    "property": "textContent",
    "equals": "Clicked!"
  }
}
```

Supported event types: `click`, `submit`, `input`, `change`.

The `effect` object describes what to check after the event fires:
- `target` — CSS selector for the element to inspect
- `property` — DOM property to read (e.g. `textContent`, `value`, `innerHTML`)
- `equals` — Expected value of the property

---

#### `events` — Event Assertions (v1.2.4)

Verifies how a JavaScript application responds to browser events. All checks run against the same shared jsdom instance that executed the student's code, so listeners registered during page load and DOM updates made by event handlers are visible to every assertion in the lab. Listener registration is tracked by intercepting `addEventListener`/`removeEventListener` inside the test environment — student code is never modified. jsdom's own internal listeners are excluded from tracking, so only listeners registered by the student's code are considered.

##### `listenerExists` — Listener Is Registered

Passes if the element selected by `selector` has at least one registered listener for `event`.

```json
{
  "type": "events",
  "assertion": "listenerExists",
  "selector": "#myButton",
  "event": "click"
}
```

##### `dispatch` — Dispatch Event and Verify Result

Dispatches `event` on the selected element, then verifies that the element selected by `expect.selector` has `expect.text` as its text content. For keyboard events (`keydown`, `keyup`, `keypress`), the optional `key` is passed to `KeyboardEvent`, so handlers that inspect `event.key` behave as in a real browser.

```json
{
  "type": "events",
  "assertion": "dispatch",
  "selector": "#myButton",
  "event": "click",
  "expect": {
    "selector": "#output",
    "text": "Clicked!"
  }
}
```

Keyboard example:

```json
{
  "type": "events",
  "assertion": "dispatch",
  "selector": "#searchField",
  "event": "keydown",
  "key": "Enter",
  "expect": {
    "selector": "#result",
    "text": "Searching..."
  }
}
```

##### `inputValueChanges` — Input Value Changes the App

Sets the selected input's value to `value`, dispatches `input` then `change`, and verifies the expected state.

```json
{
  "type": "events",
  "assertion": "inputValueChanges",
  "selector": "#nameInput",
  "value": "Alice",
  "expect": {
    "selector": "#message",
    "text": "Hi Alice"
  }
}
```

The legacy `event` assertion remains fully supported alongside `events`.

---

#### `fetch` — Fetch API Call Verification

Verifies that `fetch()` was called with the expected endpoint and/or HTTP method. No real network requests are made — fetch is mocked.

```json
{
  "type": "fetch",
  "assertion": "called"
}
```

With endpoint check:

```json
{
  "type": "fetch",
  "endpoint": "/api/users"
}
```

With endpoint and method check:

```json
{
  "type": "fetch",
  "endpoint": "/api/users",
  "method": "POST"
}
```

---

#### `json` — JSON Method Usage

Verifies that `JSON.parse()` or `JSON.stringify()` was called by the student's code.

```json
{
  "type": "json",
  "assertion": "parse"
}
```

```json
{
  "type": "json",
  "assertion": "stringify"
}
```

---

#### `console` — Console Output Verification

Verifies that `console.log()` was called with expected output. The execution engine captures `console.log()`, `console.error()`, `console.warn()`, and `console.info()` calls. The captured output is then checked against the specified assertion.

##### `logContains` — Partial Match

Passes if at least one console.log call contains the expected text (substring match).

```json
{
  "type": "console",
  "assertion": "logContains",
  "value": "Hello"
}
```

##### `logEquals` — Exact Match

Passes if at least one console.log call exactly equals the expected text.

```json
{
  "type": "console",
  "assertion": "logEquals",
  "value": "Hello, World!"
}
```

##### `logCount` — Call Count

Passes if the total number of console.log calls matches the expected count.

```json
{
  "type": "console",
  "assertion": "logCount",
  "value": 3
}
```

##### `logOrder` — Ordered Output

Passes if the ordered console output (each call joined by newline) contains the expected sequence. Useful for verifying that multiple log statements produce output in a specific order.

```json
{
  "type": "console",
  "assertion": "logOrder",
  "value": "first\nsecond"
}
```

---

#### JavaScript Lab Configuration

JavaScript labs use the same `learnthencode.json` format as HTML and CSS labs:

```json
{
  "id": "js-variables",
  "title": "JavaScript Variables",
  "lesson": "lesson-03",
  "language": "javascript",
  "entry": "starter/script.js",
  "version": "1.0.0"
}
```

JavaScript labs can also use an HTML entry file that includes `<script>` tags:

```json
{
  "id": "js-dom",
  "title": "DOM Manipulation",
  "lesson": "lesson-03",
  "language": "javascript",
  "entry": "starter/index.html",
  "version": "1.0.0"
}
```

---

#### HTML Entry Execution (v1.2.3)

Whenever a lab contains at least one JavaScript assertion — `variable`, `function`, `array`, `object`, `dom`, `event`, `fetch`, `json`, or `console` — the framework automatically initializes the JavaScript execution engine from the lab entry file. No assertion type needs special handling.

For an HTML entry such as `starter/index.html`, the lifecycle is:

1. **Load** — the entry file is read from disk.
2. **Initialize jsdom** — the HTML is loaded into a single [jsdom](https://github.com/jsdom/jsdom) instance (same as the browser environment used elsewhere in the framework). The instance exposes `window`, `document`, `HTMLElement`, `Element`, `Node`, `Event`, `CustomEvent`, `navigator`, `localStorage`, and `sessionStorage` to student code.
3. **Extract scripts** — all `<script>` tags are collected in document order. Linked scripts (`<script src="...">`) are resolved relative to the HTML file and read from disk; inline scripts are taken as-is. Empty script tags are skipped.
4. **Execute exactly once** — the combined script code runs once in the sandboxed `vm` context. All scripts share the same global scope, so a variable declared by one script is visible to later ones.
5. **Evaluate assertions** — every JavaScript assertion runs against the **same** jsdom instance and sandbox. DOM assertions query the live `document` after the student's scripts have run; no second DOM or second engine is created.

Notes:

- An HTML entry with **no JavaScript at all** still initializes the engine, so DOM assertions can inspect static markup.
- If the student's code throws at runtime, the error is captured on the engine (`executionError`) and every assertion fails with a clear "JavaScript error prevented evaluation" message instead of crashing the test run.
- Pure HTML labs (no JavaScript assertions) are unaffected — they keep using Cheerio exactly as before.

---

##### Programmatic Expect API

For `.test.js` files, a chainable expect API is available:

```js
import { expectCSS } from "learnthencode-testing/src/assertions/css/expect.js";

expectCSS("h1").toHaveCSS("color", "red");
expectCSS(".container").toHaveStyles({ display: "flex", justifyContent: "center" });
expectCSS(".navbar").toUseFlexbox();
expectCSS(".grid").toUseGrid();
expectCSS(".visible").toBeVisible();
expectCSS(".hidden").toBeHidden();
expectCSS(".box").toHaveBackgroundColor("blue");
expectCSS("h1").toHaveTextColor("red");
expectCSS("p").toHaveFontSize("16px");
expectCSS("p").toHaveFontFamily("Arial");
expectCSS("div").toHaveMargin("10px");
expectCSS("div").toHavePadding("20px");
expectCSS("div").toHaveBorder("1px solid black");
expectCSS("div").toHaveBorderRadius("4px");
expectCSS("div").toHaveWidth("200px");
expectCSS("div").toHaveHeight("100px");
expectCSS("div").toHaveMaxWidth("300px");
expectCSS("div").toHaveMinWidth("50px");
expectCSS("div").toHaveDisplay("flex");
expectCSS("div").toHavePosition("absolute");
expectCSS("div").toHaveOverflow("hidden");
```

---

### React Assertions (v1.3.0)

React labs let learners write JSX components (`.jsx` files using `react` and `react-dom`) that the framework bundles with esbuild and renders inside jsdom with React 19. Every assertion renders the named component (with optional props) and inspects the resulting DOM — no browser or test runner is required.

#### React Lab Configuration

```json
{
  "id": "react-greeting-app",
  "title": "React Greeting App",
  "lesson": "lesson-08",
  "language": "javascript",
  "entry": "src/App.jsx",
  "version": "1.0.0"
}
```

The lab's `entry` must point at an existing file (the runner reads it to locate the project). The lab directory should contain a `package.json` declaring `react` and `react-dom` (see the `dependency` assertion below).

#### Component Requirements

Every render-based assertion takes a `component` (the `.jsx` file relative to the lab) and optional `props` / `exportName`:

```json
{
  "id": "react-001",
  "name": "App renders JSX",
  "points": 5,
  "check": {
    "type": "react",
    "subtype": "renders",
    "component": "src/App.jsx"
  }
}
```

Render-based subtypes: `renders`, `props`, `state`, `hasText`, `hasElement`, `hasRole`, `hasLabel`, `hasPlaceholder`, `hasButton`, `hasHeading`, `hasLink`, `hasImage`, `hasList`, `hasForm`, `count`, `conditional`, `click`, `type`, `change`, `select`, `submit`, `reset`, `loadsOnMount`, `async`, `fetch`, `router`.

Common `expect` shapes:

| Shape | Verifies |
| --- | --- |
| `{ "text": "Hi Ada" }` | The rendered output contains the text. |
| `{ "selector": "#msg", "text": "Hi Ada" }` | The element's text equals the text. |
| `{ "selector": "#name", "value": "Ada" }` | The element's value equals the value. |
| `{ "selector": "#cb", "checked": true }` | The element's checked state matches. |
| `{ "loading": true }`, `{ "empty": true }`, `{ "error": true }` | Async UI states. |

#### Interaction Assertions

```json
{
  "id": "react-004",
  "name": "Typing updates the input",
  "points": 10,
  "check": {
    "type": "react",
    "subtype": "type",
    "component": "src/App.jsx",
    "selector": "#name",
    "value": "Ada",
    "expect": { "selector": "#name", "value": "Ada" }
  }
}
```

- `click` — clicks `selector` (button, link, checkbox, ...), verifies `expect`.
- `type` — types `value` into a controlled `selector` input/textarea, verifies `expect`.
- `change` — changes a checkbox/radio/select/text control, verifies `expect`.
- `select` — picks `value` in a `<select>` menu, verifies `expect`.
- `submit` — optionally fills `values` (`{ "#name": "Ada" }`) then submits the form, verifies `expect`.
- `reset` — types `value` into `selector`, clicks `resetSelector`, verifies `expect`.

#### Fetch Mocking

`loadsOnMount` and `fetch` assert that the component fetches data in a `useEffect` and renders the mocked response. Mocks are installed before the component renders, so effects that fire during the render see them:

```json
{
  "id": "react-006",
  "name": "Users load on mount",
  "points": 10,
  "check": {
    "type": "react",
    "subtype": "loadsOnMount",
    "component": "src/Users.jsx",
    "fetch": {
      "/api/users": { "body": [{ "id": 1, "name": "Alice" }] }
    },
    "expect": { "text": "Alice" }
  }
}
```

Mock routes are matched exactly, then by longest substring; a `"*"` key is the catch-all. Scenarios: `success` (default, serves `body`), `error` (`ok: false`, 500), `empty` (`json()` resolves to `[]`), and `loading` (never settles). `expect` supports `text`, `loading`, `empty`, and `error`. Unmatched URLs resolve to a successful empty response so components render their fallback state.

#### Other Subtypes

- `component` / `jsx` — the named component file exists / contains JSX.
- `dependency` — the lab `package.json` declares the given `dependencies` (array of package names).
- `project` — the project structure looks like a React project (package.json + entry).
- `router` — renders the component inside a `MemoryRouter` at `router.path` and verifies `expect`.

#### Programmatic React API

For `.test.js` files:

```js
import { renderReact, fireEvent, expectReact, mockFetch, withRouter } from "learnthencode-testing/src/assertions/react/index.js";
import App from "./src/App.jsx";

const view = await renderReact(App, { name: "Ada" });
view.getByText("Hello, Ada");
view.getByRole("button", "Save");

await fireEvent.click(view.getByRole("button", "Save"));
await fireEvent.type(view.getByPlaceholder("Your name"), "Ada");
await fireEvent.submit(view.querySelector("form"));

mockFetch({ "/api/users": { body: [{ id: 1, name: "Alice" }] } });
const users = await renderReact(withRouter(App, { path: "/users/42" }));
```

A runnable example lab lives in [`examples/react/`](./examples/react).

---

### React Assertions (v1.3.1)

v1.3.1 extends the React engine with static **source analysis** assertions for the remaining React course labs: effects, API integration, routing, custom hooks, and project architecture. These assertions inspect student source files through an **Abstract Syntax Tree** produced by [`@babel/parser`](https://babeljs.io/docs/babel-parser) (walked with `@babel/traverse` and `@babel/types`) — never string matching or regular expressions — so formatting differences (whitespace, quote style, line breaks) cannot affect the outcome.

All v1.3.1 assertions run on the files on disk; none of them bundle or render the component.

#### `effect` — useEffect Is Imported and Called

Verifies the component imports `useEffect` from `react` and calls it at least once.

```json
{
  "type": "react",
  "subtype": "effect",
  "component": "src/App.jsx"
}
```

**Validation rules:** `component` is required.

**Expected behavior:** passes when `useEffect` appears in the `react` import and at least one `useEffect(...)` call exists anywhere in the file.

---

#### `dependencyArray` — Effects Pass a Dependency Array

Verifies that at least one `useEffect` call passes a dependency array as its second argument. Accepts `useEffect(() => {}, [])` and `useEffect(() => {}, [count])`; rejects `useEffect(() => {})`.

```json
{
  "type": "react",
  "subtype": "dependencyArray",
  "component": "src/App.jsx"
}
```

**Validation rules:** `component` is required.

**Expected behavior:** passes when any `useEffect` call has an `ArrayExpression` as its second argument.

---

#### `cleanup` — An Effect Returns a Cleanup Function

Verifies that at least one effect callback returns a cleanup function. Accepts explicit returns (`return () => {}`, `return function cleanup() {}`, `return clearTimeout(timer)`) and implicit arrow returns (`useEffect(() => () => {}, [])`).

```json
{
  "type": "react",
  "subtype": "cleanup",
  "component": "src/App.jsx"
}
```

**Validation rules:** `component` is required.

**Expected behavior:** passes when any `useEffect` callback body contains a `return` of a function (or the callback itself is a function expression).

---

#### `customHook` — Custom Hook Exists and Uses Hooks

Verifies the file exports a function whose name starts with `use` and that the function calls at least one React hook.

```json
{
  "type": "react",
  "subtype": "customHook",
  "component": "src/hooks/useCounter.js"
}
```

**Validation rules:** `component` is required.

**Expected behavior:** passes when the file has an exported `use*` function (default or named export, function declaration or `const` arrow) containing a call to a known React hook (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`, `useReducer`, router hooks, and more).

---

#### `imports` — Expected Modules Are Imported

Verifies that every module specifier in `expect` appears in an import statement.

```json
{
  "type": "react",
  "subtype": "imports",
  "component": "src/App.jsx",
  "expect": ["react-router-dom", "./components/Navbar"]
}
```

**Validation rules:** `component` and a non-empty `expect` array of strings are required.

**Expected behavior:** passes when every entry of `expect` matches an import source exactly (`import ... from "react-router-dom"`).

---

#### `fileExists` — File Exists

Verifies a file exists relative to the lab root.

```json
{
  "type": "react",
  "subtype": "fileExists",
  "path": "src/hooks/useCounter.js"
}
```

**Validation rules:** `path` (non-empty string) is required.

**Expected behavior:** passes when the file exists on disk.

---

#### `folderExists` — Folder Exists

Verifies a folder exists relative to the lab root.

```json
{
  "type": "react",
  "subtype": "folderExists",
  "path": "src/hooks"
}
```

**Validation rules:** `path` (non-empty string) is required.

**Expected behavior:** passes when the path exists and is a directory (a file at the same path does not pass).

---

#### `route` — Route Path Exists

Verifies the component declares a `<Route path="...">` matching the expected path exactly.

```json
{
  "type": "react",
  "subtype": "route",
  "component": "src/App.jsx",
  "path": "/about"
}
```

**Validation rules:** `component` and `path` are required.

**Expected behavior:** passes when a `<Route>` element with a literal `path` attribute equal to `check.path` is found (dynamic expressions such as `path={someVar}` are ignored). The failure message lists the paths that were found.

---

#### `routeParam` — Dynamic Route Parameter Exists

Verifies a parameterized route such as `<Route path="/users/:id">`.

```json
{
  "type": "react",
  "subtype": "routeParam",
  "component": "src/App.jsx",
  "path": "/users/:id"
}
```

**Validation rules:** `component` and `path` are required.

**Expected behavior:** same matching logic as `route`, with a message that points the learner at `:` parameters and `useParams()`.

---

#### `navLink` — Navigation Link Target Exists

Verifies a `<Link to="...">` or `<NavLink to="...">` targets the expected path.

```json
{
  "type": "react",
  "subtype": "navLink",
  "component": "src/App.jsx",
  "expect": "/about"
}
```

**Validation rules:** `component` and a non-empty `expect` string are required.

**Expected behavior:** passes when any `Link` or `NavLink` element has a literal `to` attribute equal to `check.expect`.

---

The v1.3.1 example lab in [`examples/react/`](./examples/react) demonstrates every new assertion: `src/App.jsx` uses `useEffect` with a dependency array and a cleanup function, `src/hooks/useCounter.js` is a custom hook used by `App`, and `src/RoutedApp.jsx` declares routes, a dynamic parameter route, and navigation links. The full set of 40 React subtypes is dispatched from `src/assertions/react/index.js`.

---

## Project Structure

```
learnthencode-testing/
├── bin/
│   └── learnthencode-test.js   ← CLI entry point
├── src/
│   ├── assertions/             ← Built-in assertion types
│   │   ├── react/              ← React component assertions (v1.3.0, source analysis v1.3.1)
│   │   │   ├── index.js        ← reactAssertions map + programmatic API
│   │   │   ├── ast.js          ← @babel/parser AST helpers (v1.3.1)
│   │   │   ├── ast-assertions.js ← effect/dependencyArray/cleanup/customHook/imports/fileExists/folderExists/route/routeParam/navLink (v1.3.1)
│   │   │   ├── render-assertions.js
│   │   │   ├── interactions.js
│   │   │   ├── effects.js
│   │   │   ├── fetch-assertions.js
│   │   │   ├── router-assertions.js
│   │   │   ├── static.js
│   │   │   ├── environment.js ← shared jsdom environment
│   │   │   ├── render.js
│   │   │   ├── queries.js
│   │   │   ├── fire.js         ← user interaction helpers
│   │   │   ├── fetch.js        ← fetch mocking
│   │   │   ├── router.js
│   │   │   └── expect.js
│   │   ├── javascript/         ← JavaScript assertions (v1.2.1)
│   │   │   ├── index.js
│   │   │   ├── variables.js
│   │   │   ├── functions.js
│   │   │   ├── async.js        ← Async assertions (v1.2.1)
│   │   │   ├── arrays.js
│   │   │   ├── objects.js
│   │   │   ├── dom.js
│   │   │   ├── events.js
│   │   │   ├── fetch.js
│   │   │   └── json.js
│   │   ├── css/                ← CSS computed-style assertions
│   │   │   ├── base.js
│   │   │   ├── borders.js
│   │   │   ├── colors.js
│   │   │   ├── expect.js
│   │   │   ├── flexbox.js
│   │   │   ├── grid.js
│   │   │   ├── index.js
│   │   │   ├── layout.js
│   │   │   ├── normalize.js
│   │   │   ├── responsive.js
│   │   │   ├── spacing.js
│   │   │   ├── typography.js
│   │   │   └── visibility.js
│   │   ├── attributes.js
│   │   ├── count.js
│   │   ├── elements.js
│   │   ├── expect.js
│   │   ├── index.js
│   │   ├── semantic.js
│   │   ├── structure.js
│   │   └── text.js
│   ├── cli/                    ← CLI argument parsing & command handling
│   │   ├── commands.js
│   │   ├── index.js
│   │   └── parser.js
│   ├── constants/
│   │   ├── assertion-types.js   ← JS/CSS/React assertion type registry (v1.3.0)
│   │   ├── async.js            ← Async defaults (v1.2.1)
│   │   └── messages.js         ← CLI output messages
│   ├── core/                   ← Core runner pipeline
│   │   ├── detect-lab.js
│   │   ├── discover-tests.js
│   │   ├── execute-requirements.js
│   │   ├── js-execution-engine.js  ← JavaScript sandbox (v1.2.1, HTML entries v1.2.3)
│   │   ├── react-engine.js     ← React bundling + render engine (v1.3.0)
│   │   ├── lab.js
│   │   ├── load-html.js
│   │   ├── load-requirements.js
│   │   ├── results.js
│   │   ├── runner.js
│   │   ├── validate-lab.js
│   │   └── validate-requirement.js
│   ├── providers/
│   │   ├── css-renderer.js     ← CSS rendering engine (jsdom)
│   │   └── local-provider.js   ← Loads requirements from the local filesystem
│   ├── utils/
│   │   ├── async.js            ← Promise timeout race (v1.2.1)
│   │   ├── deep-equal.js       ← Deep equality (v1.2.1)
│   │   ├── filesystem.js
│   │   └── logger.js
│   └── reporter/
│       ├── colors.js           ← ANSI colour helpers
│       └── console-reporter.js ← Formats and prints test results
├── index.js
└── package.json
```

---

## Contributing

Contributions, bug reports, and feature requests are welcome. Please open an issue or submit a pull request on GitHub.

---

## License

[LearnThenCode License v1.0](./LICENSE.md) © 2026 Yahya Mohamed

