// ANSI escape codes for terminal colours.
// Each sequence starts with ESC (\x1b) followed by [<code>m.
// RESET returns the terminal to its default colour after each coloured string.
const GREEN = "\x1b[32m";
const RED   = "\x1b[31m";
const RESET = "\x1b[0m";


/**
 * Wraps text in the green ANSI colour sequence.
 * Used to highlight passing test results (✔).
 *
 * @param {string} text
 * @returns {string}
 */
export function success(text) {
  return `${GREEN}${text}${RESET}`;
}


/**
 * Wraps text in the red ANSI colour sequence.
 * Used to highlight failing test results (✘).
 *
 * @param {string} text
 * @returns {string}
 */
export function error(text) {
  return `${RED}${text}${RESET}`;
}