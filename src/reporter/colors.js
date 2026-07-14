const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";


export function success(text) {
  return `${GREEN}${text}${RESET}`;
}


export function error(text) {
  return `${RED}${text}${RESET}`;
}