import { useEffect, useState } from "react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

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

  function startEdit(user) {
    setEditingId(user.id);
    setEditName(user.name);
  }

  function handleCreate(event) {
    event.preventDefault();
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then((res) => res.json())
      .then((user) => {
        setUsers((current) => [...current, user]);
        setName("");
      });
  }

  function handleUpdate(event) {
    event.preventDefault();
    fetch(`/api/users/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    })
      .then((res) => res.json())
      .then((user) => {
        setUsers((current) =>
          current.map((entry) => (entry.id === user.id ? user : entry))
        );
        setEditingId(null);
      });
  }

  function handleDelete(id) {
    fetch(`/api/users/${id}`, { method: "DELETE" }).then(() => {
      setUsers((current) => current.filter((entry) => entry.id !== id));
    });
  }

  if (loading) {
    return <p>Loading...</p>;
  }
  if (failed) {
    return <p>Something went wrong.</p>;
  }

  return (
    <div>
      <h1>Users</h1>
      <form onSubmit={handleCreate}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New user name"
        />
        <button type="submit">Add user</button>
      </form>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {editingId === user.id ? (
              <form onSubmit={handleUpdate} data-testid="edit-form">
                <input
                  id="edit-name"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <span>
                {user.name}
                <button data-action="edit" onClick={() => startEdit(user)}>
                  Edit
                </button>
                <button data-action="delete" onClick={() => handleDelete(user.id)}>
                  Delete
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
