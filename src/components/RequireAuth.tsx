import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useLocation, useNavigate } from "react-router-dom";

export function RequireAuth({ children }) {
  const { user, loading } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { state: { from: location }, replace: true });
    }
  }, [user, loading, location, navigate]);

  if (loading) return null;
  if (!user) return null;
  return children;
}
