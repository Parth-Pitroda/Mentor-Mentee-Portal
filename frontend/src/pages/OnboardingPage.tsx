import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import { getProfileByEmail } from "@/lib/actions/student.actions";
import { routeForProfile } from "@/src/utils/routing";
import OnboardingWizard from "@/components/OnboardingWizard";
import LoadingPage from "@/src/components/LoadingPage";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const state = useAsyncData(async () => {
    const user = await getLoggedInUser();
    if (!user) return null;
    const profile = await getProfileByEmail(user.email);
    return { user, profile };
  }, []);

  useEffect(() => {
    if (!state.loading && !state.data?.user) navigate("/sign-in", { replace: true });
    if (state.data?.profile) {
      const target = routeForProfile(state.data.profile);
      if (target !== "/onboarding") navigate(target, { replace: true });
    }
  }, [navigate, state.data, state.loading]);

  if (state.loading || !state.data?.user) return <LoadingPage />;
  return <OnboardingWizard userId={state.data.user.$id} userName={state.data.user.name} userEmail={state.data.user.email} />;
}
