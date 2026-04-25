// ecommerce-app/src/pages/AdminUsers.jsx
import React, { useState, useEffect } from "react";
import API from "../api/axios";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      // Note: You'll need to create this endpoint in backend
      const { data } = await API.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
      // Fallback: Show message that feature is coming soon
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("token");
      await API.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      alert("✅ User deleted successfully");
    } catch (err) {
      console.error("❌ Failed to delete user:", err);
      alert("❌ Failed to delete user");
    }
  };

  const changeRole = async (id, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/users/${id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchUsers();
      alert(`✅ User role updated to ${newRole}`);
    } catch (err) {
      console.error("❌ Failed to update role:", err);
      alert("❌ Failed to update user role");
    }
  };

  if (loading)
    return <div style={{ padding: "2rem" }}>Loading users... 🔄</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "2rem", color: "#333" }}>
        👥 User Management
      </h1>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#2c3e50", color: "white" }}>
              <th style={{ padding: "1rem", textAlign: "left" }}>Name</th>
              <th style={{ padding: "1rem", textAlign: "left" }}>Email</th>
              <th style={{ padding: "1rem", textAlign: "left" }}>Role</th>
              <th style={{ padding: "1rem", textAlign: "left" }}>Joined</th>
              <th style={{ padding: "1rem", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: "1px solid #dee2e6" }}>
                <td style={{ padding: "1rem" }}>{user.name}</td>
                <td style={{ padding: "1rem" }}>{user.email}</td>
                <td style={{ padding: "1rem" }}>
                  <select
                    value={user.role || "user"}
                    onChange={(e) => changeRole(user._id, e.target.value)}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="user">👤 User</option>
                    <option value="admin">🔐 Admin</option>
                  </select>
                </td>
                <td style={{ padding: "1rem" }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "1rem" }}>
                  <button
                    onClick={() => deleteUser(user._id)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    ❌ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
