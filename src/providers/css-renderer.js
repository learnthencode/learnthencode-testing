import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

export function renderCSS(html, htmlFilePath) {
  const resolvedDir = path.dirname(
    path.resolve(htmlFilePath)
  ).replace(/\\/g, "/");
  const resolvedUrl = `file://${resolvedDir}/`;

  const dom = new JSDOM(html, {
    url: resolvedUrl,
    pretendToBeVisual: true,
  });

  const { document } = dom.window;

  const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
  for (const link of links) {
    const href = link.getAttribute("href");
    if (href) {
      const stylesheetPath = path.resolve(resolvedDir, href);
      try {
        const css = fs.readFileSync(stylesheetPath, "utf-8");
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
      } catch {
        throw new Error(
          `Could not load stylesheet: ${href}`
        );
      }
    }
  }

  return dom.window;
}

export function queryElement(window, selector, index = 0) {
  const elements = window.document.querySelectorAll(selector);
  return elements.length > index ? elements[index] : null;
}

export function getComputedStyle(window, selector, index = 0) {
  const element = queryElement(window, selector, index);
  if (!element) return null;
  return window.getComputedStyle(element);
}

export function setViewport(window, width, height) {
  if (window.innerWidth !== undefined) {
    Object.defineProperty(window, "innerWidth", {
      value: width,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: height,
      configurable: true,
    });
  }

  if (window.document && window.document.documentElement) {
    window.document.documentElement.style.width = `${width}px`;
    window.document.documentElement.style.height = `${height}px`;
  }

  const event = new window.Event("resize");
  window.dispatchEvent(event);
}
