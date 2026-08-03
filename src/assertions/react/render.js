import { React, act, createRoot } from "./environment.js";

/**
 * Awaits a few macrotask rounds so promises scheduled by mocked fetch
 * calls and other asynchronous effects can settle inside an act() scope.
 *
 * @param {number} rounds - Number of setTimeout(0) rounds (default 4).
 * @returns {Promise<void>}
 */
export async function flushAsync(rounds = 4) {
  for (let i = 0; i < rounds; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/**
 * Renders a React component into the shared test container.
 *
 * The render happens inside React 19's act() so state updates, effects,
 * and any immediately-settled promises are flushed before the returned
 * promise resolves. The previous root is unmounted first, so assertions
 * always inspect a fresh render.
 *
 * @param {Function} Component - The React component (function component).
 * @param {object} [props] - Props to pass to the component.
 * @param {object} environment - The shared React test environment.
 * @returns {Promise<{ container: Element, errors: Error[] }>}
 */
export async function renderReactComponent(Component, props, environment) {
  const errors = [];
  environment.activeErrorSink = errors;

  try {
    await act(async () => {
      if (environment.activeRoot) {
        environment.activeRoot.unmount();
        environment.activeRoot = null;
      }

      const root = createRoot(environment.rootContainer, {
        onUncaughtError: (error) => errors.push(error),
      });
      root.render(React.createElement(Component, props || {}));
      environment.activeRoot = root;

      await flushAsync();
    });
  } catch (error) {
    // A component that throws while rendering (e.g. it references an
    // undefined variable) makes act() rethrow the error; surface it as a
    // render failure instead of crashing the whole assertion run.
    if (!errors.some((known) => known === error)) {
      errors.push(error);
    }
  }

  return { container: environment.rootContainer, errors };
}

/**
 * Unmounts the active root, if any, and waits for its effects to run.
 *
 * @param {object} environment - The shared React test environment.
 * @returns {Promise<void>}
 */
export async function unmountReact(environment) {
  if (!environment.activeRoot) {
    return;
  }
  const root = environment.activeRoot;
  environment.activeRoot = null;
  await act(async () => {
    root.unmount();
    await flushAsync();
  });
}

/**
 * Renders a component into the shared test environment and returns a
 * handle with DOM query helpers.
 *
 * Standalone programmatic API for `.test.js` files:
 *
 *   import { renderReact } from "learnthencode-testing/src/assertions/react/render.js";
 *   import Greeting from "./Greeting.jsx";
 *
 *   const view = await renderReact(Greeting, { name: "Ada" });
 *   view.getByText("Hello, Ada");
 *   view.getByRole("button", "Save");
 *   await view.unmount();
 *
 * @param {Function} Component - The React component to render.
 * @param {object} [props] - Props passed to the component.
 * @returns {Promise<object>} A handle with container, textContent,
 *   querySelector, querySelectorAll, getByText, getByRole, getByLabel,
 *   getByPlaceholder, and unmount.
 */
export async function renderReact(Component, props) {
  const { getTestEnvironment } = await import("./environment.js");
  const { getByText, getByRole, getByLabel, getByPlaceholder } =
    await import("./queries.js");

  const environment = getTestEnvironment();
  const { container, errors } = await renderReactComponent(
    Component,
    props,
    environment
  );

  return {
    container,
    errors,
    textContent: () => container.textContent,
    querySelector: (selector) => container.querySelector(selector),
    querySelectorAll: (selector) => [...container.querySelectorAll(selector)],
    getByText: (text, options) => getByText(container, text, options),
    getByRole: (role, name) => getByRole(container, role, name),
    getByLabel: (label) => getByLabel(container, label),
    getByPlaceholder: (placeholder) => getByPlaceholder(container, placeholder),
    unmount: () => unmountReact(environment),
  };
}
