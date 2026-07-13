import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import SimpleProtectedPage from "./layouts/SimpleProtectedPage";
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardRedirectPage from "./pages/DashboardRedirectPage";
import DashboardOverviewPage from "./pages/DashboardOverviewPage";
import AcademicsPage from "./pages/AcademicsPage";
import AchievementsPage from "./pages/AchievementsPage";
import StudentMeetingsPage from "./pages/StudentMeetingsPage";
import MyProfilePage from "./pages/MyProfilePage";
import MentorProfilePage from "./pages/MentorProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import MentorDashboardPage from "./pages/MentorDashboardPage";
import MentorStudentDetailPage from "./pages/MentorStudentDetailPage";
import BookingPage from "./pages/BookingPage";
import MessagesPage from "./pages/MessagesPage";
import ProgressPage from "./pages/ProgressPage";
import MentorsPage from "./pages/MentorsPage";

function AuthFrame() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AuthFrame />}>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
      </Route>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<DashboardRedirectPage />} />
      <Route path="/dashboard/:profileId" element={<DashboardLayout />}>
        <Route index element={<DashboardOverviewPage />} />
        <Route path="academics" element={<AcademicsPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="meetings" element={<StudentMeetingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="my-profile" element={<MyProfilePage />} />
        <Route path="profile" element={<MentorProfilePage />} />
      </Route>
      <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
      <Route path="/mentor-dashboard" element={<MentorDashboardPage />} />
      <Route path="/mentor-dashboard/student/:id" element={<MentorStudentDetailPage />} />
      <Route path="/booking" element={<SimpleProtectedPage>{() => <BookingPage />}</SimpleProtectedPage>} />
      <Route path="/messages" element={<SimpleProtectedPage>{() => <MessagesPage />}</SimpleProtectedPage>} />
      <Route path="/progress" element={<SimpleProtectedPage>{() => <ProgressPage />}</SimpleProtectedPage>} />
      <Route path="/mentors" element={<SimpleProtectedPage>{() => <MentorsPage />}</SimpleProtectedPage>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
