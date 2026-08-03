import { expect } from "../expect.js";
import { flushAsync } from "./render.js";
import { act } from "./environment.js";
import { verifyExpect } from "./interactions.js";

/**
 * React Router assertions (v1.3.0).
 *
 * The component is rendered inside a MemoryRouter starting at the given
 * path. Supported shapes:
 *
 *   check = {
 *     component: "App",
 *     router: { path: "/" },            // initial location
 *     expect: { text: "Home" },
 *   }
 *
 *   check = {
 *     component: "App",
 *     router: { path: "/users/42" },
 *     expect: { text: "User 42" },      // useParams in action
 *   }
 *
 *   check = {
 *     component: "App",
 *     router: { path: "/" },
 *     navigateTo: "/about",             // click a <Link to="/about">
 *     expect: { text: "About" },
 *   }
 */

function fail(requirement, message) {
  return expect({ requirement, condition: false, message });
}

function pass(requirement) {
  return expect({ requirement, condition: true });
}

export async function routerAssertion(engine, requirement) {
  const { check } = requirement;

  const { container, errors, error } = await engine.renderComponent({
    file: check.component,
    exportName: check.exportName,
    props: check.props,
    router: {
      path: check.router?.path || "/",
    },
  });

  if (error) {
    return fail(requirement, error);
  }
  if (errors.length > 0) {
    return fail(
      requirement,
      `The component threw an error while rendering inside the router: ${errors[0].message}`
    );
  }

  await act(async () => {
    await flushAsync();
  });

  if (check.navigateTo !== undefined) {
    const link = [...container.querySelectorAll("a[href]")].find(
      (element) => element.getAttribute("href") === check.navigateTo
    );
    if (!link) {
      return fail(
        requirement,
        `Expected a <Link to="${check.navigateTo}"> to be rendered so the router can navigate, but no matching link was found.`
      );
    }

    await act(async () => {
      link.dispatchEvent(
        new (container.ownerDocument.defaultView.MouseEvent)("click", {
          bubbles: true,
          cancelable: true,
        })
      );
      await flushAsync();
    });

    const navErrors = engine.environment.activeErrorSink ?? [];
    if (navErrors.length > 0) {
      return fail(
        requirement,
        `Navigating to "${check.navigateTo}" caused an error: ${navErrors[0].message}`
      );
    }
  }

  if (check.expect?.text !== undefined) {
    const verification = verifyExpect(
      container,
      { text: check.expect.text },
      "the router rendered the route"
    );
    if (!verification.ok) {
      return fail(requirement, verification.message);
    }
  }

  return pass(requirement);
}
