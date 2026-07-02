import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getProfileByEmail } from "@/lib/actions/student.actions";
import { routeForProfile } from "@/src/utils/routing";
import LoadingPage from "@/src/components/LoadingPage";

export default function DashboardRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function redirect() {
      const user = await getLoggedInUser();
      if (!user) {
        navigate("/sign-in", { replace: true });
        return;
      }
      const profile = await getProfileByEmail(user.email);
      navigate(routeForProfile(profile), { replace: true });
    }

    redirect();
  }, [navigate]);

  return <LoadingPage label="Opening dashboard..." />;
}
