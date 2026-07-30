const JS_HINTS = {
  variable:
    "Declare a variable using let or const. Example: const name = 'value';",
  function:
    "Define a function using the function keyword or arrow syntax. Example: function greet() { }",
  array:
    "Create an array using square brackets. Example: const arr = [];",
  object:
    "Create an object using curly braces. Example: const obj = {};",
  elementExists:
    "Make sure the element is present in the HTML or has been created by your JavaScript.",
  textUpdated:
    "Update the element's textContent or innerText property in your JavaScript.",
  classAdded:
    "Use element.classList.add('className') to add a class.",
  classRemoved:
    "Use element.classList.remove('className') to remove a class.",
  elementCreated:
    "Use document.createElement() and append the new element to the DOM.",
  elementRemoved:
    "Use element.remove() or parent.removeChild() to remove an element from the DOM.",
  event:
    "Use addEventListener to attach an event handler. Example: element.addEventListener('click', () => { });",
  fetch:
    "Use fetch() to make HTTP requests. Example: fetch('/api/data').then(res => res.json());",
  json:
    "Use JSON.parse() to convert a JSON string to an object, and JSON.stringify() to convert an object to a JSON string.",
};

const ASSERTION_HINT_MAP = {
  elementExists: "elementExists",
  elementCreated: "elementCreated",
  elementRemoved: "elementRemoved",
  textUpdated: "textUpdated",
  classAdded: "classAdded",
  classRemoved: "classRemoved",
};

export function getJSHint(requirement) {
  const { check } = requirement;

  if (check.type === "variable") return JS_HINTS.variable;
  if (check.type === "function") return JS_HINTS.function;
  if (check.type === "array") return JS_HINTS.array;
  if (check.type === "object") return JS_HINTS.object;
  if (check.type === "fetch") return JS_HINTS.fetch;
  if (check.type === "json") return JS_HINTS.json;

  if (check.type === "event") return JS_HINTS.event;

  if (check.type === "dom" && ASSERTION_HINT_MAP[check.assertion]) {
    return JS_HINTS[ASSERTION_HINT_MAP[check.assertion]];
  }

  return null;
}
