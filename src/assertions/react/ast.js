import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

/**
 * React source analysis helpers (v1.3.1).
 *
 * Every v1.3.1 assertion inspects student source through an Abstract
 * Syntax Tree produced by @babel/parser instead of string matching, so
 * formatting differences (whitespace, quotes, line breaks) never affect
 * the outcome. @babel/traverse walks the tree; @babel/types semantics
 * are used through node.type checks throughout.
 *
 * All helpers return plain data — they never throw. Parse failures are
 * surfaced as { ast: null, error } so assertions can turn them into
 * descriptive failure messages.
 */

const PARSE_PLUGINS = ["jsx"];

/** Hook names that custom hooks are expected to call. */
const REACT_HOOK_NAMES = new Set([
  "useState",
  "useEffect",
  "useRef",
  "useMemo",
  "useCallback",
  "useContext",
  "useReducer",
  "useLayoutEffect",
  "useId",
  "useImperativeHandle",
  "useDebugValue",
  "useDeferredValue",
  "useTransition",
  "useSyncExternalStore",
  "useParams",
  "useNavigate",
  "useLocation",
  "useSearchParams",
  "useRouteError",
]);

/**
 * Parses a source string into an AST.
 *
 * @param {string} source - The file content.
 * @returns {{ ast: object|null, error: Error|null }}
 */
export function parseSource(source) {
  try {
    return {
      ast: parse(source, {
        sourceType: "module",
        plugins: PARSE_PLUGINS,
      }),
      error: null,
    };
  } catch (error) {
    return { ast: null, error };
  }
}

/**
 * Collects the module specifiers of every import statement.
 *
 * @param {object} ast
 * @returns {string[]} e.g. ["react", "react-router-dom", "./components/Navbar"].
 */
export function getImportSources(ast) {
  const sources = [];
  traverse(ast, {
    ImportDeclaration(path) {
      sources.push(path.node.source.value);
    },
  });
  return sources;
}

/**
 * Checks that a module specifier is imported by the file.
 *
 * @param {object} ast
 * @param {string} source - The exact module specifier (e.g. "react-router-dom").
 * @returns {boolean}
 */
export function importsModule(ast, source) {
  return getImportSources(ast).includes(source);
}

/**
 * Checks that a named binding is imported from a module.
 *
 * @param {object} ast
 * @param {string} source - The module specifier (e.g. "react").
 * @param {string} imported - The imported name (e.g. "useEffect").
 * @returns {boolean}
 */
export function importsName(ast, source, imported) {
  let found = false;
  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value !== source) {
        return;
      }
      if (path.node.specifiers.some((specifier) => {
        if (specifier.type === "ImportSpecifier") {
          return (
            specifier.imported.type === "Identifier" &&
            specifier.imported.name === imported
          );
        }
        return specifier.type === "ImportDefaultSpecifier" && imported === "default";
      })) {
        found = true;
      }
    },
  });
  return found;
}

/**
 * Returns the name of a hook call's callee, when it is a hook call.
 *
 * Accepts `useState(...)` and `React.useState(...)` style calls.
 *
 * @param {object} node - A CallExpression node.
 * @returns {string|null}
 */
export function getHookName(node) {
  const { callee } = node;
  if (callee.type === "Identifier") {
    return callee.name;
  }
  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return null;
}

/**
 * Collects call expressions for the given hook names.
 *
 * @param {object} ast
 * @param {string[]} [hookNames] - Hook names to collect; defaults to all
 *   known React hooks.
 * @returns {object[]} The CallExpression nodes.
 */
export function findHookCalls(ast, hookNames = [...REACT_HOOK_NAMES]) {
  const wanted = new Set(hookNames);
  const calls = [];
  traverse(ast, {
    CallExpression(path) {
      const name = getHookName(path.node);
      if (name && wanted.has(name)) {
        calls.push(path.node);
      }
    },
  });
  return calls;
}

/**
 * Collects useEffect call expressions.
 *
 * @param {object} ast
 * @returns {object[]}
 */
export function findUseEffectCalls(ast) {
  return findHookCalls(ast, ["useEffect"]);
}

/**
 * True when a useEffect call passes a dependency array as its second
 * argument: `useEffect(() => {}, [])` or `useEffect(() => {}, [count])`.
 *
 * @param {object} call - A useEffect CallExpression node.
 * @returns {boolean}
 */
export function hasDependencyArray(call) {
  const second = call.arguments[1];
  return second !== undefined && second.type === "ArrayExpression";
}

/**
 * True when the effect callback returns a cleanup function.
 *
 * Accepts explicit returns (`return () => {}`, `return function cleanup() {}`,
 * `return cleanup`, `return clearTimeout(timer)`) as well as implicit
 * arrow returns (`useEffect(() => () => {}, [])`).
 *
 * @param {object} call - A useEffect CallExpression node.
 * @returns {boolean}
 */
export function hasCleanup(call) {
  const callback = call.arguments[0];
  if (
    callback.type !== "ArrowFunctionExpression" &&
    callback.type !== "FunctionExpression"
  ) {
    return false;
  }

  if (callback.body.type !== "BlockStatement") {
    // Implicit return: `useEffect(() => () => {}, [])`.
    return isFunctionValue(callback.body);
  }

  return callback.body.body.some((statement) => {
    return (
      statement.type === "ReturnStatement" &&
      statement.argument !== null &&
      isFunctionValue(statement.argument)
    );
  });
}

/**
 * True when an expression evaluates to a function: a function
 * expression, or a reference to one (identifier, member expression, or
 * call that produces one, e.g. `return clearTimeout(timer)`).
 *
 * @param {object} node
 * @returns {boolean}
 */
function isFunctionValue(node) {
  switch (node.type) {
    case "ArrowFunctionExpression":
    case "FunctionExpression":
      return true;
    case "Identifier":
    case "MemberExpression":
    case "CallExpression":
    case "SequenceExpression":
      return true;
    default:
      return false;
  }
}

/**
 * Collects the exported functions of a module.
 *
 * Handles:
 *   export default function useCounter() {}
 *   export function useCounter() {}
 *   export const useCounter = () => {};
 *   function useCounter() {} ... export default useCounter;
 *
 * @param {object} ast
 * @returns {object[]} Function-ish nodes with a `.name` attached.
 */
export function getExportedFunctions(ast) {
  const functions = [];

  const addByName = (node, name) => {
    if (!node) {
      return;
    }
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      functions.push({ node, name });
    }
  };

  for (const statement of ast.program.body) {
    switch (statement.type) {
      case "ExportDefaultDeclaration":
        addByName(statement.declaration, statement.declaration.id?.name ?? "default");
        break;

      case "ExportNamedDeclaration": {
        if (statement.declaration) {
          if (statement.declaration.type === "VariableDeclaration") {
            for (const declarator of statement.declaration.declarations) {
              const name =
                declarator.id.type === "Identifier" ? declarator.id.name : null;
              addByName(declarator.init, name);
            }
          } else {
            addByName(statement.declaration, statement.declaration.id?.name);
          }
        } else {
          // export { useCounter };
          for (const specifier of statement.specifiers) {
            if (
              specifier.type === "ExportSpecifier" &&
              specifier.local.type === "Identifier"
            ) {
              functions.push({ node: null, name: specifier.local.name });
            }
          }
        }
        break;
      }

      default:
        break;
    }
  }

  // Resolve name-only exports (export { useCounter }) to their
  // declaration elsewhere in the module.
  const declarations = new Map();
  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id) {
        declarations.set(path.node.id.name, path.node);
      }
    },
    VariableDeclarator(path) {
      if (
        path.node.id.type === "Identifier" &&
        (path.node.init?.type === "ArrowFunctionExpression" ||
          path.node.init?.type === "FunctionExpression")
      ) {
        declarations.set(path.node.id.name, path.node.init);
      }
    },
  });

  for (const entry of functions) {
    if (entry.node === null && declarations.has(entry.name)) {
      entry.node = declarations.get(entry.name);
    }
  }

  return functions.filter((entry) => entry.node !== null);
}

/**
 * Checks whether a function node calls at least one React hook.
 *
 * @param {object} functionNode
 * @returns {boolean}
 */
export function callsAHook(functionNode) {
  let found = false;
  forEachCallInSubtree(functionNode, (call) => {
    const name = getHookName(call);
    if (name && REACT_HOOK_NAMES.has(name)) {
      found = true;
    }
  });
  return found;
}

/**
 * Visits every CallExpression inside a subtree rooted at `root`.
 *
 * Babel 8's traverse() requires a scope and parentPath when descending
 * into anything but a Program/File, so subtree scans use a plain
 * recursive walk instead.
 *
 * @param {object} root
 * @param {(call: object) => void} visit
 */
function forEachCallInSubtree(root, visit) {
  const walk = (node) => {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "CallExpression") {
      visit(node);
      // Still descend: nested calls may also matter.
    }
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const entry of child) {
          walk(entry);
        }
      } else if (child && typeof child.type === "string") {
        walk(child);
      }
    }
  };
  walk(root);
}

/**
 * Collects JSX elements with the given local name.
 *
 * @param {object} ast
 * @param {string} name - e.g. "Route", "Link", "NavLink".
 * @returns {object[]} JSXOpeningElement nodes.
 */
export function findJsxElements(ast, name) {
  const elements = [];
  traverse(ast, {
    JSXOpeningElement(path) {
      const elementName = path.node.name;
      if (elementName.type === "JSXIdentifier" && elementName.name === name) {
        elements.push(path.node);
      }
    },
  });
  return elements;
}

/**
 * Returns the string value of a JSX attribute.
 *
 * Only literal values are supported (`<Route path="/about">`); dynamic
 * expressions (`path={someVar}`) return null.
 *
 * @param {object} openingElement - JSXOpeningElement node.
 * @param {string} attributeName
 * @returns {string|null}
 */
export function getJsxAttribute(openingElement, attributeName) {
  const attribute = openingElement.attributes.find(
    (candidate) =>
      candidate.type === "JSXAttribute" &&
      candidate.name.type === "JSXIdentifier" &&
      candidate.name.name === attributeName
  );
  if (!attribute || !attribute.value) {
    return null;
  }
  if (attribute.value.type === "StringLiteral") {
    return attribute.value.value;
  }
  return null;
}
