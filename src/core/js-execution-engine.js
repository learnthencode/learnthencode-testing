import { JSDOM } from "jsdom";
import vm from "vm";
import fs from "fs";
import path from "path";
import { load } from "cheerio";

export function createJSEngine({ code, html }) {
  const resolvedHtml = html || "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body></body></html>";

  const dom = new JSDOM(resolvedHtml, {
    url: "http://localhost",
    pretendToBeVisual: true,
  });

  const fetchCalls = [];
  const consoleOutput = [];
  const jsonParseCalls = [];
  const jsonStringifyCalls = [];

  const sandbox = Object.assign(Object.create(null), {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    location: dom.window.location,
    history: dom.window.history,
    setTimeout: dom.window.setTimeout.bind(dom.window),
    setInterval: dom.window.setInterval.bind(dom.window),
    clearTimeout: dom.window.clearTimeout.bind(dom.window),
    clearInterval: dom.window.clearInterval.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    addEventListener: dom.window.addEventListener.bind(dom.window),
    removeEventListener: dom.window.removeEventListener.bind(dom.window),
    dispatchEvent: dom.window.dispatchEvent.bind(dom.window),
    Event: dom.window.Event,
    CustomEvent: dom.window.CustomEvent,
    MouseEvent: dom.window.MouseEvent,
    KeyboardEvent: dom.window.KeyboardEvent,
    FocusEvent: dom.window.FocusEvent,
    UIEvent: dom.window.UIEvent,
    HTMLElement: dom.window.HTMLElement,
    HTMLDocument: dom.window.HTMLDocument,
    HTMLInputElement: dom.window.HTMLInputElement,
    HTMLButtonElement: dom.window.HTMLButtonElement,
    HTMLDivElement: dom.window.HTMLDivElement,
    NodeList: dom.window.NodeList,
    Node: dom.window.Node,
    Element: dom.window.Element,
    Document: dom.window.Document,
    console: {
      log: (...args) => consoleOutput.push(args.map(String).join(" ")),
      error: (...args) => consoleOutput.push(args.map(String).join(" ")),
      warn: (...args) => consoleOutput.push(args.map(String).join(" ")),
      info: (...args) => consoleOutput.push(args.map(String).join(" ")),
    },
    fetch: async (url, options = {}) => {
      fetchCalls.push({
        url: typeof url === "string" ? url : url.toString(),
        method: (options.method || "GET").toUpperCase(),
        headers: options.headers ? { ...options.headers } : {},
        body: options.body || null,
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => "",
      };
    },
    JSON: {
      parse: (...args) => {
        jsonParseCalls.push(args[0]);
        return JSON.parse(args[0]);
      },
      stringify: (...args) => {
        jsonStringifyCalls.push(args[0]);
        return JSON.stringify(args[0]);
      },
    },
    Object, Array, String, Number, Boolean,
    Math, Date, RegExp, Error, TypeError, RangeError, SyntaxError, ReferenceError,
    Map, Set, WeakMap, WeakSet, Promise, Symbol,
    parseInt, parseFloat, isNaN, isFinite, undefined, null: null,
    global: undefined,
    globalThis: undefined,
  });

  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);

  if (code) {
    try {
      const script = new vm.Script(code, { filename: "student-code.js" });
      script.runInContext(sandbox, { timeout: 5000 });
    } catch (e) {
      return {
        window: dom.window,
        document: dom.window.document,
        fetchCalls,
        consoleOutput,
        jsonParseCalls,
        jsonStringifyCalls,
        sandbox,
        executionError: e,
        getValue() {
          return { exists: false, value: undefined, error: e.message };
        },
        evaluate() {
          return { error: e.message };
        },
      };
    }
  }

  return {
    window: dom.window,
    document: dom.window.document,
    fetchCalls,
    consoleOutput,
    jsonParseCalls,
    jsonStringifyCalls,
    sandbox,
    executionError: null,
    getValue(expr) {
      try {
        const value = vm.runInContext(expr, sandbox);
        return { exists: true, value };
      } catch (e) {
        if (e instanceof ReferenceError) {
          return { exists: false, value: undefined };
        }
        return { exists: false, value: undefined, error: e.message };
      }
    },
    evaluate(expr) {
      try {
        return vm.runInContext(expr, sandbox);
      } catch (e) {
        return { error: e.message };
      }
    },
  };
}

export function extractScriptCode(html, htmlFilePath) {
  const $ = load(html);
  const scripts = [];

  $("script").each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      const baseDir = path.dirname(htmlFilePath);
      const fullPath = path.resolve(baseDir, src);
      if (fs.existsSync(fullPath)) {
        scripts.push(fs.readFileSync(fullPath, "utf-8"));
      }
    } else {
      const content = $(el).html();
      if (content) scripts.push(content);
    }
  });

  return scripts.join("\n");
}
