import fs from "fs";
import os from "os";
import path from "path";

/**
 * Creates a temporary React lab directory on disk for end-to-end tests.
 *
 * Layout:
 *   <tmp>/learnthencode.json
 *   <tmp>/package.json
 *   <tmp>/src/...            (student files, names relative to the lab root)
 *   <tmp>/private-tests/requirements.json
 *
 * @param {object} options
 * @param {string} [options.entry] - Entry path (defaults to "src/main.jsx").
 * @param {object} [options.files] - Student files (relative path -> content).
 * @param {object[]} options.requirements - The requirements array.
 * @param {object} [options.packageJson] - Overrides for package.json.
 * @returns {string} The absolute path of the temporary lab directory.
 */
export function createReactLab({
  entry = "src/main.jsx",
  files = {},
  requirements,
  packageJson = {},
}) {
  const labDir = fs.mkdtempSync(path.join(os.tmpdir(), "ltnc-react-lab-"));

  fs.writeFileSync(
    path.join(labDir, "learnthencode.json"),
    JSON.stringify({
      id: "temp-react-lab",
      title: "Temporary React Lab",
      lesson: "lesson-temp-react",
      language: "javascript",
      entry,
      version: "1.0.0",
    })
  );

  const pkg = {
    name: "temp-react-lab",
    version: "0.0.1",
    private: true,
    dependencies: {
      react: "^19.2.8",
      "react-dom": "^19.2.8",
      "react-router-dom": "^7.18.2",
    },
    devDependencies: {
      vite: "^5.0.0",
    },
    ...packageJson,
  };
  fs.writeFileSync(
    path.join(labDir, "package.json"),
    JSON.stringify(pkg, null, 2)
  );

  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(labDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  fs.mkdirSync(path.join(labDir, "private-tests"), { recursive: true });
  fs.writeFileSync(
    path.join(labDir, "private-tests", "requirements.json"),
    JSON.stringify({ requirements: requirements || [] })
  );

  return labDir;
}

/**
 * Removes a temporary React lab directory created by createReactLab().
 *
 * @param {string} labDir
 */
export function removeReactLab(labDir) {
  fs.rmSync(labDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Shared student fixtures (kept inline to survive temp-lab removal).
// ---------------------------------------------------------------------------

export const COUNTER_APP_JSX = `
import { useState } from "react";

export default function App({ initial = 0, name = "World" }) {
  const [count, setCount] = useState(initial);
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p className="count">Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Add</button>
    </div>
  );
}
`;

export const PROPS_APP_JSX = `
export default function Greeting({ name, job }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>{job || "unknown"}</p>
    </div>
  );
}
`;

export const FORM_APP_JSX = `
import { useState } from "react";

export default function Form() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(name);
      }}
    >
      <label htmlFor="name">Name</label>
      <input
        id="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />
      <button type="submit">Submit</button>
      {submitted && <p data-testid="result">Submitted: {submitted}</p>}
    </form>
  );
}
`;

export const CHECKBOX_APP_JSX = `
import { useState } from "react";

export default function Toggle() {
  const [checked, setChecked] = useState(false);
  return (
    <div>
      <label htmlFor="agree">Agree</label>
      <input
        id="agree"
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      <p>{checked ? "Agreed" : "Not agreed"}</p>
    </div>
  );
}
`;

export const SELECT_APP_JSX = `
import { useState } from "react";

export default function Picker() {
  const [color, setColor] = useState("");
  return (
    <div>
      <label htmlFor="color">Color</label>
      <select
        id="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      >
        <option value="">Pick one</option>
        <option value="red">Red</option>
        <option value="blue">Blue</option>
      </select>
      <p>Chosen: {color || "none"}</p>
    </div>
  );
}
`;

export const RESET_APP_JSX = `
import { useState } from "react";

export default function ResetForm() {
  const [value, setValue] = useState("");
  return (
    <form>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="button" onClick={() => setValue("")}>Reset</button>
      <p>{value || "empty"}</p>
    </form>
  );
}
`;

export const USERS_APP_JSX = `
import { useEffect, useState } from "react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Request failed");
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setFailed(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }
  if (failed) {
    return <p>Something went wrong.</p>;
  }
  if (users.length === 0) {
    return <p>No users found.</p>;
  }
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
`;

export const ASYNC_APP_JSX = `
import { useEffect, useState } from "react";

export default function Delayed() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 20);
    return () => clearTimeout(timer);
  }, []);
  return <p>{ready ? "Ready" : "Waiting"}</p>;
}
`;

export const ROUTED_APP_JSX = `
import { Link, Routes, Route, useParams } from "react-router-dom";

function User() {
  const { id } = useParams();
  return <h1>User {id}</h1>;
}

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/about" element={<h1>About</h1>} />
        <Route path="/users/:id" element={<User />} />
      </Routes>
    </div>
  );
}
`;

export const STRING_RETURN_APP_JSX = `
export default function Plain() {
  return "hello";
}
`;

export const CLASS_APP_JSX = `
import { Component } from "react";

export default class Welcome extends Component {
  render() {
    return <h1>Welcome</h1>;
  }
}
`;

export const NO_EXPORT_APP_JSX = `
function Hidden() {
  return <p>hi</p>;
}
`;

export const NOT_FUNCTION_APP_JSX = `
export const data = [1, 2, 3];
`;

export const INVALID_JSX_APP_JSX = `
export default function Broken() {
  return <div>oops</div>
`;

export const EFFECT_APP_JSX = `
import { useEffect, useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setCount((value) => value + 1), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Add</button>
    </div>
  );
}
`;

export const EFFECT_NO_IMPORT_JSX = `
export default function App() {
  return <p>hello</p>;
}
`;

export const EFFECT_IMPORT_NO_CALL_JSX = `
import { useEffect } from "react";

export default function App() {
  return <p>hello</p>;
}
`;

export const EFFECT_NO_DEP_ARRAY_JSX = `
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    console.log("ran");
  });
  return <p>hello</p>;
}
`;

export const EFFECT_NO_CLEANUP_JSX = `
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    console.log("ran");
  }, []);
  return <p>hello</p>;
}
`;

export const EFFECT_IMPLICIT_CLEANUP_JSX = `
import { useEffect } from "react";

export default function App() {
  useEffect(() => () => {
    console.log("cleaning up");
  }, []);
  return <p>hello</p>;
}
`;

export const CUSTOM_HOOK_JSX = `
import { useEffect, useState } from "react";

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
    return () => {
      document.title = "LearnThenCode";
    };
  }, [count]);

  function increment() {
    setCount((value) => value + 1);
  }

  return [count, increment];
}
`;

export const CUSTOM_HOOK_DEFAULT_JSX = `
import { useRef } from "react";

export default function usePrevious(value) {
  const ref = useRef();
  return ref.current;
}
`;

export const CUSTOM_HOOK_NOT_EXPORTED_JSX = `
import { useState } from "react";

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  return [count, () => setCount((value) => value + 1)];
}
`;

export const CUSTOM_HOOK_BAD_NAME_JSX = `
import { useState } from "react";

export function counter() {
  const [count, setCount] = useState(0);
  return [count, setCount];
}
`;

export const CUSTOM_HOOK_NO_HOOKS_JSX = `
export function useCounter(initial = 0) {
  return initial;
}
`;

export const IMPORTS_APP_JSX = `
import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<p>Home</p>} />
        <Route path="/about" element={<p>About</p>} />
      </Routes>
    </div>
  );
}
`;

export const ROUTED_NAVLINK_APP_JSX = `
import { NavLink, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <div>
      <nav>
        <NavLink to="/about">About</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/about" element={<h1>About</h1>} />
        <Route path="/users/:id" element={<h1>User</h1>} />
      </Routes>
    </div>
  );
}
`;

export const NO_ROUTES_APP_JSX = `
export default function App() {
  return <p>no routes here</p>;
}
`;
