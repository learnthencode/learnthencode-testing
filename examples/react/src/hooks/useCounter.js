import { useEffect, useState } from "react";

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    document.title = `Count: ${count}`;
    return () => {
      document.title = "LearnThenCode";
    };
  }, [count]);

  function increment() {
    setCount((value) => value + 1);
  }

  return [count, increment];
}
