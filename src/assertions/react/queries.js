/**
 * Accessibility-friendly DOM queries for React assertions (v1.3.0).
 *
 * These helpers prefer how users actually find things in an interface —
 * by role, by label, by placeholder, by visible text — instead of
 * implementation details. They intentionally implement a pragmatic
 * subset of ARIA: explicit `role` attributes plus the common implicit
 * roles (button, link, heading, textbox, checkbox, ...).
 */

const IMPLICIT_ROLES = {
  button: [
    "button",
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
  ],
  link: ["a[href]"],
  heading: ["h1", "h2", "h3", "h4", "h5", "h6"],
  textbox: [
    "input:not([type])",
    'input[type="text"]',
    'input[type="email"]',
    'input[type="password"]',
    'input[type="search"]',
    'input[type="tel"]',
    'input[type="url"]',
    "textarea",
  ],
  checkbox: ['input[type="checkbox"]'],
  radio: ['input[type="radio"]'],
  combobox: ["select"],
  option: ["option"],
  list: ["ul", "ol"],
  listitem: ["li"],
  form: ["form"],
  img: ["img"],
  navigation: ["nav"],
  main: ["main"],
  banner: ["header"],
  contentinfo: ["footer"],
  complementary: ["aside"],
};

/**
 * Computes a pragmatic accessible name for an element.
 *
 * Priority: aria-label, aria-labelledby, a wrapping <label>, a
 * <label for="...">, placeholder (for inputs), alt (for images), then
 * the element's own text content.
 *
 * @param {Element} element - The DOM element.
 * @returns {string} The accessible name.
 */
export function computeAccessibleName(element) {
  const ariaLabel = element.getAttribute?.("aria-label");
  if (ariaLabel) {
    return ariaLabel.trim();
  }

  const labelledBy = element.getAttribute?.("aria-labelledby");
  if (labelledBy) {
    const parts = labelledBy
      .split(/\s+/)
      .map((id) => {
        const ref = element.ownerDocument.getElementById(id);
        return ref ? ref.textContent.trim() : "";
      })
      .filter(Boolean);
    if (parts.length) {
      return parts.join(" ").trim();
    }
  }

  const id = element.id;
  if (id) {
    const labels = [...element.ownerDocument.querySelectorAll(`label[for="${id}"]`)];
    if (labels.length) {
      return labels[0].textContent.trim();
    }
  }

  const parentLabel = element.closest?.("label");
  if (parentLabel) {
    return parentLabel.textContent.trim();
  }

  const placeholder = element.getAttribute?.("placeholder");
  if (placeholder) {
    return placeholder.trim();
  }

  if (element.tagName === "IMG") {
    return (element.getAttribute("alt") || "").trim();
  }

  if (element.tagName === "INPUT") {
    return element.value || "";
  }

  return element.textContent.trim();
}

/**
 * Finds an element by ARIA role, optionally matching its accessible name.
 *
 * @param {Element} container - The rendered container to search.
 * @param {string} role - The ARIA role (e.g. "button", "heading").
 * @param {string} [name] - Optional accessible name to match.
 * @returns {Element|null} The first matching element, or null.
 */
export function getByRole(container, role, name) {
  const explicit = [...container.querySelectorAll(`[role="${role}"]`)];
  const implicit = (IMPLICIT_ROLES[role] || []).flatMap((selector) => [
    ...container.querySelectorAll(selector),
  ]);

  const seen = new Set();
  const candidates = [];
  for (const element of [...explicit, ...implicit]) {
    if (!seen.has(element)) {
      seen.add(element);
      candidates.push(element);
    }
  }

  if (name !== undefined) {
    const target = String(name);
    return (
      candidates.find(
        (element) =>
          computeAccessibleName(element).toLowerCase() === target.toLowerCase()
      ) ?? null
    );
  }

  return candidates[0] ?? null;
}

function findById(container, id) {
  for (const element of container.querySelectorAll("*")) {
    if (element.id === id) {
      return element;
    }
  }
  return null;
}

/**
 * Finds a form control by its <label> text.
 *
 * Supports both <label for="..."> and <label> wrapping the control.
 *
 * @param {Element} container - The rendered container to search.
 * @param {string} labelText - The label text to match.
 * @returns {Element|null} The associated control, or null.
 */
export function getByLabel(container, labelText) {
  const target = String(labelText);
  for (const label of container.querySelectorAll("label")) {
    if (label.textContent.trim() !== target) {
      continue;
    }
    const forId = label.getAttribute("for");
    if (forId) {
      const control = findById(container, forId);
      if (control) {
        return control;
      }
    }
    const control = label.querySelector("input, select, textarea, button");
    if (control) {
      return control;
    }
  }
  return null;
}

/**
 * Finds an input or textarea by its placeholder text.
 *
 * @param {Element} container - The rendered container to search.
 * @param {string} placeholder - The placeholder text to match.
 * @returns {Element|null} The matching element, or null.
 */
export function getByPlaceholder(container, placeholder) {
  const target = String(placeholder);
  for (const element of container.querySelectorAll("[placeholder]")) {
    if (element.getAttribute("placeholder") === target) {
      return element;
    }
  }
  return null;
}

const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

/**
 * Finds an element by its visible text.
 *
 * Exact matching requires `{ exact: true }`; by default a substring
 * match is used, mirroring how users scan a page.
 *
 * @param {Element} container - The rendered container to search.
 * @param {string} text - The text to look for.
 * @param {object} [options] - { exact: boolean }.
 * @returns {Element|null} The matching element, or null.
 */
export function getByText(container, text, options) {
  const { exact = false } = options || {};
  const target = normalizeText(String(text));

  const all = [...container.querySelectorAll("*")];

  for (const element of all) {
    const direct = [...element.childNodes]
      .filter((node) => node.nodeType === 3)
      .map((node) => node.textContent)
      .join(" ");
    const normalized = normalizeText(direct);
    if (!normalized) {
      continue;
    }
    if (exact ? normalized === target : normalized.includes(target)) {
      return element;
    }
  }

  for (const element of all) {
    const normalized = normalizeText(element.textContent);
    if (!normalized) {
      continue;
    }
    if (exact ? normalized === target : normalized.includes(target)) {
      return element;
    }
  }

  return null;
}
