import { expect } from "../expect.js";

export function functionAssertion(engine, requirement) {
  const { check } = requirement;
  const { name, args, returns, hasParams } = check;

  if (engine.executionError) {
    return expect({
      requirement,
      condition: false,
      message: `JavaScript error prevented evaluation: ${engine.executionError.message}`,
    });
  }

  const result = engine.getValue(name);

  if (!result.exists) {
    return expect({
      requirement,
      condition: false,
      message: `Function "${name}" was not found.`,
    });
  }

  if (typeof result.value !== "function") {
    return expect({
      requirement,
      condition: false,
      message: `"${name}" exists but is not a function.`,
    });
  }

  if (hasParams !== undefined) {
    const paramCount = result.value.length;
    if (hasParams && paramCount === 0) {
      return expect({
        requirement,
        condition: false,
        message: `Function "${name}" should accept parameters but has none.`,
      });
    }
    if (!hasParams && paramCount > 0) {
      return expect({
        requirement,
        condition: false,
        message: `Function "${name}" should have no parameters but has ${paramCount}.`,
      });
    }
  }

  if (returns !== undefined) {
    const callArgs = args || [];
    let actualReturn;

    try {
      actualReturn = result.value(...callArgs);
    } catch (e) {
      return expect({
        requirement,
        condition: false,
        message: `Function "${name}(${callArgs.map(j => JSON.stringify(j)).join(", ")})" threw an error: ${e.message}.`,
      });
    }

    const expectedJson = JSON.stringify(returns);
    const actualJson = JSON.stringify(actualReturn);

    if (actualJson !== expectedJson) {
      return expect({
        requirement,
        condition: false,
        message: `Expected "${name}(${callArgs.map(j => JSON.stringify(j)).join(", ")})" to return ${expectedJson}, but got ${actualJson}.`,
      });
    }

    if (actualReturn !== returns) {
      return expect({
        requirement,
        condition: false,
        message: `Expected "${name}(${callArgs.map(j => JSON.stringify(j)).join(", ")})" to return ${expectedJson}, but got ${actualJson}.`,
      });
    }
  }

  return expect({
    requirement,
    condition: true,
  });
}
