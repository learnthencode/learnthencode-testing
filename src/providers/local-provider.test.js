import { loadTests } from "./local-provider.js";


const path =
  loadTests(
    "./private-tests"
  );


console.log(path);