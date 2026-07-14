import {
  createResult,
  createResultCollection,
} from "./results.js";


const result = createResult({
  name: "Example test",
  passed: true,
});


console.log(result);


const collection = createResultCollection();

collection.add(result);


console.log(collection.summary());