function greet() {
  return "hello";
}

async function getUser() {
  return { id: 1, name: "John" };
}

function getNumbers() {
  return Promise.resolve([1, 2, 3]);
}

function fetchMessage() {
  return new Promise((resolve) =>
    setTimeout(() => resolve("Hello"), 10)
  );
}

function returnsPromise() {
  return Promise.resolve(42);
}

function failRequest() {
  return Promise.reject(new Error("Network Error"));
}

function waitAndFail() {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Network Error")), 10)
  );
}
