import React, { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getLoggedInUser } from "@/lib/actions/auth.actions";
import {
  createGlobalNotice,
  getAllMentors,
  getAllProfiles,
  getDepartmentAnalytics,
  getGlobalSettings,
  getLatestNotices,
  getSystemActivityLog,
  getSystemAnalytics,
  getUnassignedStudents,
  getVerifiedStudentsForExport,
  importMasterAdvisoryList,
  updateGlobalSettings,
} from "@/lib/actions/student.actions";
import LogoutButton from "@/components/LogoutButton";
import DepartmentChart from "@/components/DepartmentChart";
import ExportCSVButton from "@/components/ExportCSVButton";
import UserManagementTable from "@/components/UserManagementTable";
import AssignmentManager from "@/components/AssignmentManager";
import BulkImportManager from "@/components/BulkImportManager";
import StatCard from "@/src/components/StatCard";
import NoticeAdminCard from "@/src/components/NoticeAdminCard";
import ActivityCard from "@/src/components/ActivityCard";
import LoadingPage from "@/src/components/LoadingPage";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const state = useAsyncData(async () => {
    const user = await getLoggedInUser();
    if (!user) return null;

    const [analytics, mentors, notices, exportData, allProfiles, systemSettings, deptData, unassignedStudents, activity] = await Promise.all([
      getSystemAnalytics(),
      getAllMentors(),
      getLatestNotices(5),
      getVerifiedStudentsForExport(),
      getAllProfiles(),
      getGlobalSettings(),
      getDepartmentAnalytics(),
      getUnassignedStudents(),
      getSystemActivityLog(),
    ]);

    return { user, analytics, mentors, notices, exportData, allProfiles, systemSettings, deptData, unassignedStudents, activity };
  }, [activeTab]);

  useEffect(() => {
    if (!state.loading && !state.data?.user) navigate("/sign-in", { replace: true });
  }, [navigate, state.data, state.loading]);

  if (state.loading || !state.data) return <LoadingPage label="Loading admin dashboard..." />;

  const data = state.data as any;

  async function handleNotice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await createGlobalNotice(new FormData(e.currentTarget));
    e.currentTarget.reset();
  }

  async function handleSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (data.systemSettings?.$id) await updateGlobalSettings(data.systemSettings.$id, new FormData(e.currentTarget));
  }

  async function handleMasterImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await importMasterAdvisoryList(new FormData(e.currentTarget));
    e.currentTarget.reset();
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="fixed hidden h-full w-64 flex-col bg-[#1A1A24] text-white md:flex">
        <div className="flex h-24 shrink-0 flex-col items-center justify-center border-b border-white/5 px-6">
          <img src="/pdeu_logo.png" alt="PDEU Logo" className="h-12 w-auto object-contain" />
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Administrator</span>
        </div>
        <nav className="flex-1 space-y-1.5 py-6 pl-4 pr-0">
          {[
            ["overview", "System Overview"],
            ["assignments", "Mentor Assignments"],
            ["users", "User Database"],
            ["settings", "Global Settings"],
          ].map(([key, label]) => (
            <Link key={key} to={`?tab=${key}`} className={`block py-3 text-lg transition ${activeTab === key ? "rounded-l-full bg-[#F8FAFC] pl-4 font-bold text-slate-900" : "mr-4 rounded-full px-4 font-medium text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/5 p-4">
          <LogoutButton variant="sidebar-dark" />
        </div>
      </aside>

      <main className="flex-1 p-8 md:ml-64">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold capitalize tracking-tight text-slate-900">{activeTab.replace("-", " ")}</h1>
            {activeTab === "users" && <ExportCSVButton data={data.exportData} filename={`pdeu-verified-students-${new Date().toISOString().split("T")[0]}.csv`} />}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <StatCard label="Total Mentees" value={data.analytics.totalStudents} />
                <StatCard label="Verified" value={data.analytics.verifiedStudents} />
                <StatCard label="Pending" value={data.analytics.pendingVerifications} />
                <StatCard label="Total Mentors" value={data.mentors.length} />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-bold text-slate-800">Department Distribution</h3>
                <DepartmentChart data={data.deptData} />
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <NoticeAdminCard notices={data.notices} onSubmit={handleNotice} />
                <ActivityCard activity={data.activity} />
              </div>
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-8">
              <BulkImportManager />
              <form onSubmit={handleMasterImport} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800">Master Advisory List Import</h3>
                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <input name="file" type="file" accept=".csv" required className="flex-1 rounded-lg border border-slate-200 p-2 text-sm" />
                  <button className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white">Run Import</button>
                </div>
              </form>
              <AssignmentManager unassignedStudents={data.unassignedStudents} availableMentors={data.mentors} />
            </div>
          )}

          {activeTab === "users" && <UserManagementTable profiles={data.allProfiles} />}

          {activeTab === "settings" && (
            <form onSubmit={handleSettings} className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-slate-800">Academic Settings</h3>
              <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Active Term</label>
              <input name="activeTerm" defaultValue={data.systemSettings?.activeTerm || ""} className="mb-4 w-full rounded-lg border border-slate-200 p-3" />
              <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Academic Year</label>
              <input name="academicYear" defaultValue={data.systemSettings?.academicYear || ""} className="mb-6 w-full rounded-lg border border-slate-200 p-3" />
              <button className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white">Save Settings</button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
