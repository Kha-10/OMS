import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles, redirectPath }) => {
  const userData = localStorage.getItem("user");
  const superAdminData = localStorage.getItem("superAdmin");
  const tenantData = localStorage.getItem("tenant");

  const userObj = userData ? JSON.parse(userData) : null;
  const superAdminObj = superAdminData ? JSON.parse(superAdminData) : null;
  const tenantObj = tenantData ? JSON.parse(tenantData) : null;

  //   You can customize this logic to check roles and if the user is authenticated
  const isAuthenticated = !!userObj || !!superAdminObj || !!tenantObj;
  console.log(isAuthenticated);

  //   Example of role-based checking
  const userRole = userObj?.role || superAdminObj?.role || tenantObj?.role;
  console.log(userRole);

  if (!isAuthenticated) {
    return <Navigate to={redirectPath || "/sign-in"} />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/forbidden" />;
  }

  return children;
};

export default ProtectedRoute;
