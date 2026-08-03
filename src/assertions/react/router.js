import { React, reactRouterDom } from "./environment.js";

/**
 * Wraps a component in a MemoryRouter at a given path, for router tests
 * that do not need (or must not use) a browser history.
 *
 * Standalone programmatic API for `.test.js` files:
 *
 *   import { renderReact } from "learnthencode-testing/src/assertions/react/render.js";
 *   import { withRouter } from "learnthencode-testing/src/assertions/react/router.js";
 *   import App from "./App.jsx";
 *
 *   const view = await renderReact(withRouter(App, { path: "/about" }));
 *
 * @param {Function} Component - The component to wrap (e.g. an App with <Routes>).
 * @param {object} [options] - { path: initial location (default "/") }.
 * @returns {Function} A wrapper component.
 */
export function withRouter(Component, { path = "/" } = {}) {
  const MemoryRouter = reactRouterDom.MemoryRouter;

  function RoutedComponent(props) {
    return React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(Component, props)
    );
  }

  return RoutedComponent;
}
