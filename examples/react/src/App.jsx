import { useEffect, useState } from "react";
import { useCounter } from "./hooks/useCounter";

export default function App() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [count, increment] = useCounter(0);

  useEffect(() => {
    document.title = "Greeting App";
    return () => {
      document.title = "LearnThenCode";
    };
  }, []);

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
      <button id="counter" onClick={increment}>
        Count: {count}
      </button>
    </main>
  );
}
