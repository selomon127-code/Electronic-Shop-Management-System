import React from "react";
import { Navigate } from "react-router-dom";

function RequireRole({ user, roles, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (roles.includes(user.role)) return children;

  return (
    <Navigate
      to={user.role === "system_admin" ? "/admin/system" : "/admin/dashboard"}
      replace
    />
  );
}

export default RequireRole;
