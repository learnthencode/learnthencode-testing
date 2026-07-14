import { expect } from "./expect.js";


const result = expect({
  name: "Example test",
  condition: true,
  message: "Failed",
  hint: "Fix it",
});


console.log(result);