import { Link, NavLink, Route, Routes, useParams } from "react-router-dom";

function UserProfile() {
  const { id } = useParams();
  return <h1>User {id}</h1>;
}

export default function RoutedApp() {
  return (
    <div>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <Link to="/users/42">User 42</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/about" element={<h1>About</h1>} />
        <Route path="/users/:id" element={<UserProfile />} />
      </Routes>
    </div>
  );
}
