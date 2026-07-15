import { validateLab } from "./validate-lab.js";

validateLab({
  id: "html-lab-01",
  lesson: "lesson-01",
  title: "HTML Headings",
  language: "html",
  entry: "starter/index.html",
  version: "1.0.0",
});

console.log("Configuration is valid.");