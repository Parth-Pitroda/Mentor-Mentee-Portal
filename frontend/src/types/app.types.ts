import type { UserProfile } from "@/types";

export type User = {
  $id: string;
  email: string;
  name?: string;
  role?: string;
};

export type DashboardContext = {
  user: User;
  profileId: string;
  profile: UserProfile;
};

export const emptyApprovals = { meetings: [], meetingRequests: [], academics: [], achievements: [] };
