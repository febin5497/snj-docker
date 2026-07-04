import { Navigate } from "react-router-dom";

const RoleRoute = ({ children, allowedRoles }) => {

    const role = localStorage.getItem("role");

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default RoleRoute;