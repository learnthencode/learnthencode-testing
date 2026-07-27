# Architecture

## Overview

LearnThenCode Testing Framework validates student lab submissions against declarative requirements. It supports both HTML and CSS assertion types through a modular, pluggable architecture.

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
        -> src/core/load-html.js (read learner HTML)
        -> src/core/execute-requirements.js (run each assertion)
          -> For HTML assertions: Cheerio parses HTML -> assertion function
          -> For CSS assertions: jsdom renders HTML+CSS -> computed style check
            -> src/assertions/index.js (lookup assertion by type)
              -> elements.js / attributes.js / count.js / text.js / semantic.js / structure.js
              -> css/index.js (dispatches to sub-modules)
                -> css/base.js (toHaveCSS, toHaveStyles)
                -> css/flexbox.js / css/grid.js / css/typography.js
                -> css/colors.js / css/spacing.js / css/layout.js
                -> css/borders.js / css/visibility.js
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

## Assertion Registry

Assertions are registered in `src/assertions/index.js` under the `assertions` map. The `check.type` field in requirements.json selects which assertion to execute. CSS assertions use `type: "css"` and dispatch to sub-modules based on the `check.assertion`, `check.property`, or `check.styles` fields.

## Value Normalization

Before comparison, CSS values are normalized:

- Colors: named, hex, rgb() all converted to lowercase hex
- Font weights: named values (bold, normal) mapped to numeric
- Whitespace trimmed, case lowered
- `!important` removed

## Extending

To add a new assertion type:
1. Create the assertion function in `src/assertions/` (or `src/assertions/css/` for CSS)
2. Register it in `src/assertions/index.js`
3. Add validation in `src/core/validate-requirement.js` if needed
4. Create tests in `tests/`
