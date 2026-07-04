import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateToken = () => {
      try {
        // Check if token exists
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const role = localStorage.getItem("role");

        if (!token || !userId) {
          setIsAuthenticated(false);
          setIsValidating(false);
          return;
        }

        // If requiredRole is specified, check if user has that role
        if (requiredRole && role !== requiredRole) {
          console.warn(`Access denied: User role '${role}' does not match required role '${requiredRole}'`);
          setIsAuthenticated(false);
          setIsValidating(false);
          return;
        }

        // Token is valid and user has required role
        setIsAuthenticated(true);
        setIsValidating(false);
      } catch (error) {
        console.error("Token validation error:", error);
        // Clear potentially corrupted auth data
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        setIsAuthenticated(false);
        setIsValidating(false);
      }
    };

    validateToken();
  }, [requiredRole]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "var(--bg-tertiary)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: "4px solid rgba(102, 126, 234, 0.2)",
            borderTop: "4px solid var(--color-primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <p style={{ color: "var(--text-tertiary)" }}>Validating session...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated and authorized - render component
  return children;
};

export default ProtectedRoute;