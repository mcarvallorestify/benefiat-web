import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { useUserRole } from "@/hooks/useUserRole";

interface RequireRoleProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { user, loading: authLoading } = useUser();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) return;

    const roleNormalized = (role || "").toLowerCase();
    const allowedNormalized = allowedRoles.map((r) => r.toLowerCase());

    if (!allowedNormalized.includes(roleNormalized)) {
      if (location.pathname !== "/punto-de-venta") {
        navigate("/punto-de-venta", { replace: true });
      }
    }
  }, [authLoading, roleLoading, role, allowedRoles, navigate, location.pathname, user]);

  if (authLoading || roleLoading) return null;
  if (!user) return null;

  const roleNormalized = (role || "").toLowerCase();
  const allowedNormalized = allowedRoles.map((r) => r.toLowerCase());
  if (!allowedNormalized.includes(roleNormalized)) return null;

  return children;
}
