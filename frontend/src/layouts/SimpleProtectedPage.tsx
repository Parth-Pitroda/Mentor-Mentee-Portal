import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import PortalTopNavbar from "@/components/PortalTopNavbar";
import LoadingPage from "@/src/components/LoadingPage";
import type { User } from "@/src/types/app.types";

export default function SimpleProtectedPage({ children }: { children: (user: User) => React.ReactNode }) {
  const navigate = useNavigate();
  const state = useAsyncData(async () => getLoggedInUser(), []);

  useEffect(() => {
    if (!state.loading && !state.data) navigate("/sign-in", { replace: true });
  }, [navigate, state.data, state.loading]);

  if (state.loading || !state.data) return <LoadingPage />;
  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <PortalTopNavbar userName={state.data.name || "PDEU User"} userEmail={state.data.email} />
      {children(state.data)}
    </div>
  );
}
