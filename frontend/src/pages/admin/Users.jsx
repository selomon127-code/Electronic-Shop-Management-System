// ecommerce-app/src/pages/admin/Users.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminApi } from "../../api/adminApi";
import {
  AdminStyles, Icon, Kpi, Modal, PageHeader, TableSkeleton, EmptyState, ErrorBanner,
  money, num, formatDate, useDebounced, useFeedback,
} from "./adminUi";

const EMPTY_USER = { name: "", email: "", password: "", phone: "", role: "user" };

const ROLE_STYLE = {
  admin: { bg: "#fef3c7", fg: "#92400e" },
  user: { bg: "#dbeafe", fg: "#1e40af" },
};

function UserAvatar({ user, large }) {
  const cls = `ad-avatar${large ? " lg" : ""}`;
  if (user.avatar) return <img className={cls} src={user.avatar} alt={user.name} />;
  return <div className={cls}>{user.name?.charAt(0).toUpperCase() || "?"}</div>;
}

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [creating, setCreating] = useState(false);
  const [addError, setAddError] = useState("");

  const debouncedSearch = useDebounced(search);
  const { toast, confirm, ui } = useFeedback();
  const requestId = useRef(0);

  const fetchUsers = useCallback(async () => {
    const id = ++requestId.current;
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await adminApi.getUsers(params);
      if (id !== requestId.current) return;
      setUsers(data.users || []);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [roleFilter, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (user, newRole) => {
    const ok = await confirm({
      title: "Change user role?",
      message: `${user.name} will become ${newRole === "admin" ? "an admin with access to the admin panel" : "a regular user"}.`,
      confirmLabel: "Change role",
    });
    if (!ok) return;

    try {
      await adminApi.updateUserRole(user._id, newRole);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u)));
      toast("success", `${user.name} is now ${newRole}`);
    } catch (err) {
      toast("error", err.response?.data?.message || err.message || "Failed to change role");
    }
  };

  const handleDelete = async (user) => {
    const ok = await confirm({
      title: "Delete user?",
      message: `"${user.name}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete user",
      danger: true,
    });
    if (!ok) return;

    try {
      await adminApi.deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast("success", `${user.name} deleted`);
    } catch (err) {
      toast("error", err.response?.data?.message || err.message || "Failed to delete user");
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddError("");
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError("");
    setCreating(true);
    try {
      const { data } = await adminApi.createUser(newUser);
      setUsers((prev) => [data.user, ...prev]);
      setShowAddModal(false);
      setNewUser(EMPTY_USER);
      toast("success", "User created successfully");
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      setLoadingDetailsId(userId);
      const { data } = await adminApi.getUser(userId);
      setUserDetails(data);
    } catch (err) {
      toast("error", err.response?.data?.message || "Failed to load user details");
    } finally {
      setLoadingDetailsId(null);
    }
  };

  const admins = users.filter((u) => u.role === "admin").length;
  const regular = users.filter((u) => u.role === "user").length;

  return (
    <div className="ad">
      <AdminStyles />

      <PageHeader title="Users" subtitle="Manage registered users and their roles">
        <button className="ad-btn" onClick={fetchUsers} disabled={loading}>
          <span className={loading ? "ad-spin" : ""}><Icon name="refresh" size={16} /></span>
          Refresh
        </button>
        <button className="ad-btn primary" onClick={() => setShowAddModal(true)}>
          <Icon name="plus" size={16} /> Add user
        </button>
      </PageHeader>

      <div className="ad-kpis">
        <Kpi label="Users in view" value={num(users.length)} icon="users" color="#4f46e5" bg="#e0e7ff" />
        <Kpi label="Regular users" value={num(regular)} icon="users" color="#2563eb" bg="#dbeafe" />
        <Kpi label="Admins" value={num(admins)} icon="shield" color="#d97706" bg="#fef3c7" />
      </div>

      {/* Filters */}
      <div className="ad-card ad-toolbar">
        <div className="ad-search">
          <Icon name="search" size={16} />
          <input
            className="ad-input"
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
          />
        </div>
        <select
          className="ad-input auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="user">Users only</option>
          <option value="admin">Admins only</option>
        </select>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchUsers} />}

      {/* Table */}
      <div className="ad-card">
        {loading && users.length === 0 ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <EmptyState icon="users" title="No users found" text={search || roleFilter ? "Try adjusting your search or filter." : "Registered users will appear here."} />
        ) : (
          <div className="ad-table-wrap" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Auth</th>
                  <th>Joined</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const rs = ROLE_STYLE[user.role] || ROLE_STYLE.user;
                  const google = user.authProvider === "google";
                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="ad-user">
                          <UserAvatar user={user} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.name}</div>
                            {user.phone && <div className="ad-muted ad-small">{user.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="ad-muted">{user.email}</td>
                      <td>
                        <select
                          className="ad-select-pill"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          aria-label={`Role for ${user.name}`}
                          style={{ background: rs.bg, color: rs.fg }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span
                          className="ad-badge"
                          style={{ background: google ? "#dcfce7" : "#f1f5f9", color: google ? "#166534" : "#475569", textTransform: "capitalize" }}
                        >
                          {user.authProvider || "local"}
                        </span>
                      </td>
                      <td className="ad-muted">{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="ad-row-actions" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="ad-btn icon view"
                            title="View details"
                            aria-label="View details"
                            disabled={loadingDetailsId === user._id}
                            onClick={() => viewUserDetails(user._id)}
                          >
                            {loadingDetailsId === user._id ? (
                              <span className="ad-spin"><Icon name="refresh" size={16} /></span>
                            ) : (
                              <Icon name="eye" size={16} />
                            )}
                          </button>
                          <button className="ad-btn icon del" title="Delete user" aria-label="Delete user" onClick={() => handleDelete(user)}>
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add user modal */}
      {showAddModal && (
        <Modal
          title="Add new user"
          width={500}
          onClose={closeAddModal}
          footer={
            <>
              <button type="button" className="ad-btn" onClick={closeAddModal}>Cancel</button>
              <button type="submit" form="add-user-form" className="ad-btn primary" disabled={creating}>
                {creating ? "Creating…" : "Create user"}
              </button>
            </>
          }
        >
          {addError && <div className="ad-form-error" role="alert">{addError}</div>}

          <form id="add-user-form" onSubmit={handleAddUser}>
            <div className="ad-field">
              <label className="ad-label" htmlFor="nu-name">Full name *</label>
              <input id="nu-name" className="ad-input" type="text" required placeholder="John Doe"
                value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div className="ad-field">
              <label className="ad-label" htmlFor="nu-email">Email *</label>
              <input id="nu-email" className="ad-input" type="email" required placeholder="user@example.com"
                value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="ad-grid2">
              <div className="ad-field">
                <label className="ad-label" htmlFor="nu-pass">Password * <small>(min 6)</small></label>
                <input id="nu-pass" className="ad-input" type="password" required minLength={6} placeholder="••••••••"
                  value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <div className="ad-field">
                <label className="ad-label" htmlFor="nu-phone">Phone</label>
                <input id="nu-phone" className="ad-input" type="tel" placeholder="+251911234567"
                  value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
              </div>
            </div>
            <div className="ad-field" style={{ marginBottom: 0 }}>
              <label className="ad-label" htmlFor="nu-role">Role *</label>
              <select id="nu-role" className="ad-input" value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="user">User (regular customer)</option>
                <option value="admin">Admin (can access the admin panel)</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* User details modal */}
      {userDetails && (
        <Modal
          title="User details"
          onClose={() => setUserDetails(null)}
          footer={<button className="ad-btn primary" onClick={() => setUserDetails(null)}>Close</button>}
        >
          <div className="ad-user" style={{ gap: "1rem" }}>
            <UserAvatar user={userDetails.user} large />
            <div>
              <h3 style={{ margin: "0 0 .2rem" }}>{userDetails.user.name}</h3>
              <p className="ad-muted" style={{ margin: "0 0 .4rem", fontSize: ".9rem" }}>{userDetails.user.email}</p>
              <span
                className="ad-badge"
                style={{
                  background: (ROLE_STYLE[userDetails.user.role] || ROLE_STYLE.user).bg,
                  color: (ROLE_STYLE[userDetails.user.role] || ROLE_STYLE.user).fg,
                  textTransform: "capitalize",
                }}
              >
                {userDetails.user.role}
              </span>
            </div>
          </div>

          <div className="ad-mini-grid">
            <div className="ad-mini"><small>Orders</small><b>{num(userDetails.stats?.totalOrders)}</b></div>
            <div className="ad-mini"><small>Total spent</small><b style={{ color: "#059669" }}>{money(userDetails.stats?.totalSpent)}</b></div>
            <div className="ad-mini"><small>Member since</small><b style={{ fontSize: ".95rem" }}>{formatDate(userDetails.user.createdAt)}</b></div>
          </div>

          <dl className="ad-kv" style={{ marginBottom: 0 }}>
            <dt>Phone</dt><dd>{userDetails.user.phone || "—"}</dd>
            <dt>Sign-in</dt><dd style={{ textTransform: "capitalize" }}>{userDetails.user.authProvider || "local"}</dd>
          </dl>
        </Modal>
      )}

      {ui}
    </div>
  );
}

export default Users;
