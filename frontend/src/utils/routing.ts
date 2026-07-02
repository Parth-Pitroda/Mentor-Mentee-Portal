export function routeForProfile(profile: any) {
  if (!profile) return "/onboarding";
  if (profile.role === "admin" || profile.role === "coordinator") return "/admin-dashboard";
  if (profile.role === "mentor") return "/mentor-dashboard";

  const complete = profile.department && profile.department !== "Pending Assignment" && profile.department !== "Unassigned";
  return complete ? `/dashboard/${profile.$id}` : "/onboarding";
}

export function initials(name?: string) {
  return name ? name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "M";
}

export function mentorTitle(tab: string) {
  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    roster: "My Mentees",
    meetings: "Meetings",
    directory: "Student Directory",
    notices: "University Notices",
    "student-profile": "Student Dossier",
    "student-academics": "Academic History",
    "student-achievements": "Achievements",
  };
  return titles[tab] || "Dashboard";
}
