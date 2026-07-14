import { executeRequirement } from "./execute-requirements.js";
import { loadHTML } from "./load-html.js";


const html = loadHTML(
  "./test-lab/starter/index.html"
);


const requirement = {
  name: "Page contains heading",

  check: {
    type: "element",
    selector: "h1",
  },
};


const result = executeRequirement(
  requirement,
  html
);


console.log(result);