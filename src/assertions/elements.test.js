import { load } from "cheerio";
import { elementExists } from "./elements.js";
import { loadHTML } from "../core/load-html.js";

const html = loadHTML("./test-lab/starter/index.html");

const $ = load(html);

const requirement = {
  name: "Page contains heading",
  check: {
    type: "element",
    selector: "h1",
  },
};

console.log(
  elementExists($, requirement)
);