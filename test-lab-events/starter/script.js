const clickButton = document.getElementById("click-button");
const output = document.getElementById("output");

clickButton.addEventListener("click", () => {
  output.textContent = "Clicked";
});

const nameInput = document.getElementById("name-input");
const message = document.getElementById("message");

nameInput.addEventListener("input", () => {
  message.textContent = "Hi " + nameInput.value;
});

const searchField = document.getElementById("search-field");
const searchResult = document.getElementById("search-result");

searchField.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchResult.textContent = "Enter pressed";
  }
});
