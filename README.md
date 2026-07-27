# learnthencode-testing

> A lightweight HTML and CSS testing framework for the [LearnThenCode](https://learnthencode.com) Full Stack Software Engineering Bootcamp.

`learnthencode-testing` provides a declarative, JSON-driven way to validate learner HTML and CSS submissions against a set of requirements. It ships with a CLI, a rich set of built-in assertion types, and a color-coded console reporter designed for an educational environment.

For HTML labs, the framework uses [Cheerio](https://cheerio.js.org/) to parse and query the DOM. For CSS labs, it uses [jsdom](https://github.com/jsdom/jsdom) to render the HTML, load stylesheets, apply styles, and validate **computed styles** — giving accurate pass/fail feedback that matches what the learner sees in the browser.

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

The framework operates around the concept of a **lab** — a directory containing a learner's HTML/CSS work alongside a configuration file. When you run `learnthencode-test run`, the framework:

1. **Detects** the lab by looking for `learnthencode.json` in the current directory.
2. **Loads** the lab's entry HTML file (e.g. `starter/index.html`).
3. **Discovers** the hidden `requirements.json` from the `private-tests` directory (one level up from the lab).
4. **Executes** each requirement's assertion against the parsed HTML using [Cheerio](https://cheerio.js.org/) (for HTML assertions) or renders the HTML with CSS using [jsdom](https://github.com/jsdom/jsdom) and validates computed styles (for CSS assertions).
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
 Version 1.0.0
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

## Project Structure

```
learnthencode-testing/
├── bin/
│   └── learnthencode-test.js   ← CLI entry point
├── src/
│   ├── assertions/             ← Built-in assertion types
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
│   │   └── messages.js         ← CLI output messages
│   ├── core/                   ← Core runner pipeline
│   │   ├── detect-lab.js
│   │   ├── discover-tests.js
│   │   ├── execute-requirements.js
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

