import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getProfileByEmail } from "@/lib/actions/student.actions";
import { routeForProfile } from "@/src/utils/routing";
import LandingPageClient from "@/components/LandingPageClient";
import LoadingPage from "@/src/components/LoadingPage";

export default function HomePage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function check() {
      const user = await getLoggedInUser();
      if (!active) return;

      if (!user) {
        setChecking(false);
        return;
      }

      const profile = await getProfileByEmail(user.email);
      if (active) navigate(routeForProfile(profile), { replace: true });
    }

    check().catch(() => setChecking(false));
    return () => {
      active = false;
    };
  }, [navigate]);

  if (checking) return <LoadingPage />;
  return <LandingPageClient />;
}
