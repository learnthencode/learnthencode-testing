import { useState } from "react";

export default function App() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(0);

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("Hello " + name);
  }

  return (
    <main>
      <h1>Greeting App</h1>
      <form onSubmit={handleSubmit}>
        <input
          id="name"
          value={name}
          placeholder="Your name"
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit">Greet</button>
      </form>
      <p id="message">{message}</p>
      <button id="counter" onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </main>
  );
}
