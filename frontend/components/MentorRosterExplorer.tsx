"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFileViewUrl } from "@/lib/files";
import { 
  Mail, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  GraduationCap, 
  BookOpen,
  CheckSquare,
  Download,
  AlertCircle,
  BellRing,
  ListTodo,
  History,
  Sparkles,
  Clock,
  Trash2,
  Plus,
  CalendarDays
} from "lucide-react";

type ViewMode = "all" | "top" | "attention" | "overdue";
type SearchField = "all" | "name" | "rollNo" | "email" | "department" | "semester";

export type MenteeCardStudent = {
  $id: string;
  fullName: string;
  email: string;
  rollNo?: string;
  department?: string;
  semester?: number;
  cgpa?: number;
  phone?: string;
  profilePictureId?: string;
  performanceScore?: number;
  latestCpi?: number;
  latestSpi?: number;
  performanceSource?: string;
  latestAcademicSemester?: number;
  backlogs?: number | string;
};

function normalize(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function getSearchText(mentee: MenteeCardStudent) {
  return [
    mentee.fullName,
    mentee.email,
    mentee.rollNo,
    mentee.department,
    mentee.semester,
  ].map(normalize).join(" ");
}

function getScore(mentee: MenteeCardStudent) {
  return Number(mentee.performanceScore || mentee.latestCpi || mentee.cgpa || mentee.latestSpi || 0);
}

export default function MentorRosterExplorer({ 
  mentees, 
  meetings = [], 
  pendingApprovalCount = 0, 
  pendingApprovals = { meetings: [], meetingRequests: [], academics: [], achievements: [] }, 
  isDemo = false,
  showRosterTable = true
}: { 
  mentees: MenteeCardStudent[], 
  meetings?: any[], 
  pendingApprovalCount?: number, 
  pendingApprovals?: any, 
  isDemo?: boolean,
  showRosterTable?: boolean
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  
  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleCSVDownload = () => {
    if (mentees.length === 0) {
      alert("No mentees to export.");
      return;
    }
    const headers = ["Full Name", "Roll Number", "Email", "Phone", "Department", "Semester", "CGPA", "Backlogs"];
    const csvRows = [
      headers.join(","),
      ...mentees.map(m => {
        const cgpaVal = m.cgpa !== undefined ? m.cgpa : (m.latestCpi !== undefined ? m.latestCpi : "N/A");
        const backlogVal = m.backlogs !== undefined ? m.backlogs : 0;
        return [
          `"${m.fullName}"`,
          `"${m.rollNo || "N/A"}"`,
          `"${m.email}"`,
          `"${m.phone || "N/A"}"`,
          `"${m.department || "N/A"}"`,
          `"${m.semester || "N/A"}"`,
          `"${cgpaVal}"`,
          `"${backlogVal}"`
        ].join(",");
      })
    ];
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Mentee_Roster_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setCurrentPage(1);
  };

  const handleSearchFieldChange = (val: SearchField) => {
    setSearchField(val);
    setCurrentPage(1);
  };

  const handleViewModeChange = (val: ViewMode) => {
    setViewMode(val);
    setCurrentPage(1);
  };

  const rankedMentees = useMemo(() => {
    return [...mentees].sort((a, b) => {
      const scoreDelta = getScore(b) - getScore(a);
      if (scoreDelta !== 0) return scoreDelta;

      return normalize(a.fullName).localeCompare(normalize(b.fullName));
    });
  }, [mentees]);

  const topPerformers = useMemo(() => {
    return rankedMentees.filter((mentee) => getScore(mentee) >= 8.0);
  }, [rankedMentees]);

  const visibleMentees = useMemo(() => {
    let source = mentees;
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    if (viewMode === "top") {
      source = topPerformers;
    } else if (viewMode === "attention") {
      source = mentees.filter(m => Number(m.cgpa || m.latestCpi || 0) < 6.5 || Number(m.backlogs || 0) > 0);
    } else if (viewMode === "overdue") {
      source = mentees.filter(m => {
        const menteeMeetings = meetings.filter(meet => meet.studentId === m.$id || meet.studentName === m.fullName);
        if (menteeMeetings.length === 0) return true;
        const dates = menteeMeetings.map(meet => meet.date ? new Date(meet.date).getTime() : 0).filter(d => d > 0);
        if (dates.length === 0) return true;
        const latestDate = Math.max(...dates);
        return latestDate < thirtyDaysAgo;
      });
    }

    const search = normalize(query);
    if (!search) return source;

    return source.filter((mentee) => {
      if (searchField === "all") {
        return getSearchText(mentee).includes(search);
      }

      const fieldMap: Record<string, string | undefined> = {
        name: mentee.fullName,
        rollNo: mentee.rollNo,
        email: mentee.email,
        department: mentee.department,
        semester: mentee.semester !== undefined ? String(mentee.semester) : undefined,
      };

      return normalize(fieldMap[searchField]).includes(search);
    });
  }, [mentees, query, searchField, topPerformers, viewMode, meetings]);

  // Paginated visible mentees
  const totalPages = Math.ceil(visibleMentees.length / itemsPerPage);
  const paginatedMentees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return visibleMentees.slice(start, start + itemsPerPage);
  }, [visibleMentees, currentPage]);

  const stats = useMemo(() => {
    const cgpas = mentees
      .map(m => Number(m.cgpa || m.latestCpi || m.latestSpi || 0))
      .filter(val => val > 0);
    const avgCgpa = cgpas.length > 0
      ? (cgpas.reduce((sum, val) => sum + val, 0) / cgpas.length).toFixed(2)
      : "N/A";
    
    const highPerformers = mentees.filter(m => Number(m.cgpa || m.latestCpi || 0) >= 8.0).length;
    
    const needsAttention = mentees.filter(m => Number(m.cgpa || m.latestCpi || 0) < 6.5 || Number(m.backlogs || 0) > 0).length;
    
    let overdue = 0;
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    mentees.forEach(m => {
      const menteeMeetings = meetings.filter(meet => meet.studentId === m.$id || meet.studentName === m.fullName);
      if (menteeMeetings.length === 0) {
        overdue++;
      } else {
        const dates = menteeMeetings.map(meet => meet.date ? new Date(meet.date).getTime() : 0).filter(d => d > 0);
        if (dates.length === 0) {
          overdue++;
        } else {
          const latestDate = Math.max(...dates);
          if (latestDate < thirtyDaysAgo) {
            overdue++;
          }
        }
      }
    });

    const band9Plus = mentees.filter(m => Number(m.cgpa || m.latestCpi || 0) >= 9.0).length;
    const band8to9 = mentees.filter(m => {
      const gpa = Number(m.cgpa || m.latestCpi || 0);
      return gpa >= 8.0 && gpa < 9.0;
    }).length;
    const band65to8 = mentees.filter(m => {
      const gpa = Number(m.cgpa || m.latestCpi || 0);
      return gpa >= 6.5 && gpa < 8.0;
    }).length;
    const bandBelow65 = mentees.filter(m => {
      const gpa = Number(m.cgpa || m.latestCpi || 0);
      return gpa > 0 && gpa < 6.5;
    }).length;

    return {
      total: mentees.length,
      avgCgpa,
      highPerformers,
      needsAttention,
      overdue,
      band9Plus,
      band8to9,
      band65to8,
      bandBelow65
    };
  }, [mentees, meetings]);

  return (
    <div className="space-y-6">
      
      {/* Summary Cards Deck (combines metrics and sparkline) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-300">
        
        {/* Metric 1: Students count */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm flex items-center justify-between hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-default select-none">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Mentees</p>
            <h3 className="mt-1 text-3xl font-black text-slate-900">{stats.total}</h3>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 2: Pending Approvals */}
        <Link 
          href="/mentor-dashboard/approvals"
          className={`rounded-xl border p-5 shadow-sm flex items-center justify-between hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 select-none ${
            pendingApprovalCount > 0 
              ? "bg-amber-50/40 border-amber-200 text-amber-900" 
              : "bg-white border-slate-100 text-slate-900"
          }`}
        >
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pending Approvals</p>
            <h3 className={`mt-1 text-3xl font-black ${pendingApprovalCount > 0 ? "text-amber-700" : "text-slate-900"}`}>
              {pendingApprovalCount}
            </h3>
            {pendingApprovalCount > 0 && (
              <p className="text-[9px] font-bold text-amber-600 mt-0.5">Action required</p>
            )}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full border shrink-0 ${
            pendingApprovalCount > 0 
              ? "bg-amber-100 border-amber-200 text-amber-700" 
              : "bg-slate-50 border-slate-150 text-slate-400"
          }`}>
            <CheckSquare className="h-5 w-5" />
          </div>
        </Link>

        {/* Metric 3: High Performers count */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm flex items-center justify-between hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-default select-none">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Top Achievers</p>
            <h3 className="mt-1 text-3xl font-black text-slate-900">{stats.highPerformers}</h3>
            <p className="text-[9px] font-bold text-emerald-600 mt-0.5">CGPA &ge; 8.0</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 4: Needs Support */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm flex items-center justify-between hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-default select-none">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Needs Support</p>
            <h3 className="mt-1 text-3xl font-black text-slate-900">{stats.needsAttention}</h3>
            <p className="text-[9px] font-bold text-rose-500 mt-0.5">Low GPA / Backlogs</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 5: Overdue check-ins */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm flex items-center justify-between hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-default select-none">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Overdue check-ins</p>
            <h3 className="mt-1 text-3xl font-black text-slate-900">{stats.overdue}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">&gt; 30 days idle</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-650 border border-slate-200 shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 6: Roster GPA Health & Sparkline */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-3 flex flex-col justify-between relative group/spark hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-default select-none">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Roster GPA Health</p>
              <h3 className="mt-1 text-2xl font-black text-slate-900">{stats.avgCgpa} Average</h3>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <TrendingUp className="w-3 h-3" />
              <span>Stable</span>
            </div>
          </div>
          
          {/* Sparkline Path */}
          <div className="mt-2 w-full h-10 relative">
            <svg className="w-full h-full text-emerald-500 rounded-b-xl" viewBox="0 0 100 30" fill="none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path
                d="M0,22 Q15,8 30,18 T60,12 T90,20 T100,5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0,22 Q15,8 30,18 T60,12 T90,20 T100,5 L100,30 L0,30 Z"
                fill="url(#sparkline-grad)"
              />
              {/* Pulsing live dot */}
              <circle cx="100" cy="5" r="3" className="fill-emerald-500 animate-ping" />
              <circle cx="100" cy="5" r="2.5" className="fill-emerald-500" />
            </svg>
            <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-extrabold px-3.5 py-2.5 rounded-xl opacity-0 group-hover/spark:opacity-100 transition-all duration-300 shadow-lg pointer-events-none whitespace-nowrap z-30 space-y-1.5 border border-white/10 select-none">
              <p className="border-b border-white/10 pb-1 text-center font-black">GPA Distribution (Avg: {stats.avgCgpa})</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] font-bold text-slate-300">
                <span>&ge; 9.0 Excellent:</span> <span className="text-white text-right">{stats.band9Plus}</span>
                <span>8.0 - 9.0 Good:</span> <span className="text-white text-right">{stats.band8to9}</span>
                <span>6.5 - 8.0 Average:</span> <span className="text-white text-right">{stats.band65to8}</span>
                <span>&lt; 6.5 Needs Support:</span> <span className={`text-right ${stats.bandBelow65 > 0 ? "text-rose-400 font-extrabold" : "text-white"}`}>{stats.bandBelow65}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Analytics & Progress Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
        <CGPAChartCard stats={stats} />
        <MeetingTrackerCard mentees={mentees} meetings={meetings} />
        <AnnouncementComposerCard />
      </div>

      {/* Schedule, Events, & Action Items Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
        <CalendarCard meetings={meetings} />
        <UpcomingEventsCard meetings={meetings} />
        <ActionItemsCard mentees={mentees} meetings={meetings} pendingApprovalCount={pendingApprovalCount} />
      </div>

      {/* Timeline Feed Row */}
      <div className="grid gap-6 animate-in fade-in duration-300">
        <RecentActivityCard mentees={mentees} meetings={meetings} pendingApprovals={pendingApprovals} />
      </div>

      {/* Main Roster Card */}
      {showRosterTable && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          
          {/* Table Filter / Header */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Mentees Roster</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Filter and manage student profiles under your guidance</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search inputs */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search mentees..."
                  className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-[180px]"
                />
              </div>

              {/* Export Roster Button */}
              <button
                onClick={handleCSVDownload}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                title="Export Roster to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Roster</span>
              </button>
            </div>
          </div>

          {/* Table Data */}
          {visibleMentees.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No matching mentees found</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">Try resetting search filters or checking spelling.</p>
            </div>
          ) : (
            <div className="overflow-x-auto select-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-4 font-bold">Student Name</th>
                    <th className="py-4 px-4 font-bold">Roll Number</th>
                    <th className="py-4 px-4 font-bold">Department / Sem</th>
                    <th className="py-4 px-4 font-bold">Academic GPA</th>
                    <th className="py-4 px-4 font-bold">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedMentees.map((mentee) => (
                    <tr 
                      key={mentee.$id} 
                      onClick={() => router.push(`?tab=student-profile&id=${mentee.$id}${isDemo ? "&demo=true" : ""}`)}
                      className="hover:bg-slate-50/50 transition-colors text-sm text-slate-650 cursor-pointer animate-in fade-in duration-200"
                    >
                      <td className="py-4 px-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden shrink-0 shadow-sm">
                          {mentee.profilePictureId ? (
                            <img 
                              src={getFileViewUrl(mentee.profilePictureId)} 
                              alt={mentee.fullName} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            mentee.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 leading-tight truncate">{mentee.fullName}</p>
                          <p className="text-xs text-slate-400 mt-1 truncate">{mentee.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-700">{mentee.rollNo || "N/A"}</td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-800 truncate max-w-[180px]">{mentee.department || "N/A"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Semester {mentee.semester || "N/A"}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            CGPA: {Number(mentee.cgpa || mentee.latestCpi || 0).toFixed(2)}
                          </span>
                          {Number(mentee.backlogs || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100">
                              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>{mentee.backlogs} Backlog{Number(mentee.backlogs) > 1 ? "s" : ""}</span>
                            </span>
                          )}
                          {Number(mentee.cgpa || mentee.latestCpi || 0) < 6.5 && Number(mentee.cgpa || mentee.latestCpi || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100">
                              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Low GPA Alert</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={`mailto:${mentee.email}`} 
                            title="Send Email"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-850 hover:bg-slate-50 transition-all shadow-sm"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                          {mentee.phone && (
                            <a 
                              href={`tel:${mentee.phone}`} 
                              title="Call Phone"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-850 hover:bg-slate-50 transition-all shadow-sm"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500 select-none">
              <span className="font-semibold text-xs text-slate-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, visibleMentees.length)} of {visibleMentees.length} mentees
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-855 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {/* Dynamic Page Numbers */}
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all border ${
                        currentPage === pageNum
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-855 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

// ================= SUB-COMPONENTS FOR DASHBOARD ANALYTICS & ACTIONS =================

function CGPAChartCard({ stats }: { stats: any }) {
  const bands = [
    { label: "9.0+ Excellent", count: stats.band9Plus, color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "8.0 - 9.0 Good", count: stats.band8to9, color: "bg-teal-500", text: "text-teal-700", bg: "bg-teal-50" },
    { label: "6.5 - 8.0 Average", count: stats.band65to8, color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
    { label: "< 6.5 Support", count: stats.bandBelow65, color: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" }
  ];

  const maxCount = Math.max(...bands.map(b => b.count), 1);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-800">CGPA Distribution</h3>
      </div>
      <div className="space-y-3.5">
        {bands.map((band, idx) => {
          const percent = (band.count / maxCount) * 100;
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-650">
                <span>{band.label}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${band.bg} ${band.text}`}>{band.count} student{band.count !== 1 ? "s" : ""}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${band.color} rounded-full transition-all duration-1000 ease-out`} 
                  style={{ width: `${band.count > 0 ? percent : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MeetingTrackerCard({ mentees, meetings }: { mentees: any[], meetings: any[] }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const metMentees = new Set();
  meetings.forEach(meet => {
    if (meet.date) {
      const d = new Date(meet.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const match = mentees.find(m => m.$id === meet.studentId || m.fullName === meet.studentName);
        if (match) metMentees.add(match.$id);
      }
    }
  });

  const total = mentees.length;
  const met = metMentees.size;
  const unmet = Math.max(0, total - met);
  const completionRate = total > 0 ? Math.round((met / total) * 100) : 0;

  const radius = 32;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
        <Clock className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-slate-800">Monthly Meeting Tracker</h3>
      </div>
      <div className="flex items-center gap-5 justify-center py-2">
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              className="text-slate-100"
              strokeWidth={stroke}
              stroke="currentColor"
              fill="transparent"
              r={normalizedRadius}
              cx={48}
              cy={48}
            />
            <circle
              className="text-blue-600 transition-all duration-1000 ease-out"
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={normalizedRadius}
              cx={48}
              cy={48}
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-lg font-black text-slate-850 leading-none">{completionRate}%</span>
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Met</span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <span className="font-semibold text-slate-500">Completed: <b className="text-slate-800 font-bold">{met}</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0" />
            <span className="font-semibold text-slate-500">Remaining: <b className="text-slate-800 font-bold">{unmet}</b></span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Goal: Meet all {total} mentees this month</p>
        </div>
      </div>
    </div>
  );
}

function AnnouncementComposerCard() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setStatus("loading");
    try {
      const { createGlobalNotice } = await import("@/lib/actions/student.actions");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      const res = await createGlobalNotice(formData);
      if (res?.success !== false) {
        setStatus("success");
        setTitle("");
        setContent("");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
        <BellRing className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-bold text-slate-800">Quick Notice Broadcast</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Announcement Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full text-xs font-bold px-3 py-2 border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 transition-all placeholder:text-slate-400 text-slate-700"
        />
        <textarea
          placeholder="Type announcement details here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={2}
          className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 outline-none resize-none focus:bg-white focus:border-blue-400 transition-all placeholder:text-slate-400 text-slate-700"
        />
        <div className="flex items-center justify-between pt-1">
          {status === "success" && (
            <span className="text-[10px] font-bold text-emerald-600 animate-pulse">Broadcast sent!</span>
          )}
          {status === "error" && (
            <span className="text-[10px] font-bold text-rose-500">Failed to send.</span>
          )}
          {status === "idle" && <span />}
          {status === "loading" && (
            <span className="text-[10px] font-bold text-slate-400 animate-pulse">Sending...</span>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            Broadcast
          </button>
        </div>
      </form>
    </div>
  );
}

function ActionItemsCard({ mentees, meetings, pendingApprovalCount }: { mentees: any[], meetings: any[], pendingApprovalCount: number }) {
  const [checkedAutoIds, setCheckedAutoIds] = useState<string[]>([]);
  const [customTasks, setCustomTasks] = useState<Array<{ id: string; label: string; done: boolean }>>([]);
  const [newCustomLabel, setNewCustomLabel] = useState("");

  // Load custom tasks and checked auto IDs from localStorage
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem("mentor_custom_tasks");
      if (savedCustom) setCustomTasks(JSON.parse(savedCustom));
      const savedCheckedAuto = localStorage.getItem("mentor_checked_auto_ids");
      if (savedCheckedAuto) setCheckedAutoIds(JSON.parse(savedCheckedAuto));
    } catch (e) {
      console.error("Failed to load todo data:", e);
    }
  }, []);

  // Compute auto tasks
  const autoTasks = useMemo(() => {
    const list = [];
    
    if (pendingApprovalCount > 0) {
      list.push({
        id: "approvals",
        label: `Review ${pendingApprovalCount} pending student record submission${pendingApprovalCount !== 1 ? "s" : ""}`,
        type: "link"
      });
    }

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const overdueCount = mentees.filter(m => {
      const mMeetings = meetings.filter(meet => meet.studentId === m.$id || meet.studentName === m.fullName);
      if (mMeetings.length === 0) return true;
      const dates = mMeetings.map(meet => meet.date ? new Date(meet.date).getTime() : 0).filter(d => d > 0);
      if (dates.length === 0) return true;
      return Math.max(...dates) < thirtyDaysAgo;
    }).length;

    if (overdueCount > 0) {
      list.push({
        id: "checkins",
        label: `Log a check-in session for ${overdueCount} student${overdueCount !== 1 ? "s" : ""} with overdue status`,
        type: "task"
      });
    }

    const upcomingMeetingsCount = meetings.filter(meet => {
      if (!meet.date) return false;
      const t = new Date(meet.date).getTime();
      return t >= Date.now();
    }).length;

    if (upcomingMeetingsCount === 0) {
      list.push({
        id: "schedule",
        label: "Schedule next week's regular advising meetings",
        type: "task"
      });
    }

    if (list.length === 0) {
      list.push({ id: "default-1", label: "Perform mid-semester CPI roster reviews", type: "task" });
      list.push({ id: "default-2", label: "Verify emergency profile info completeness", type: "task" });
    }

    return list;
  }, [mentees, meetings, pendingApprovalCount]);

  const toggleAutoTask = (id: string) => {
    setCheckedAutoIds(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("mentor_checked_auto_ids", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleCustomTask = (id: string) => {
    setCustomTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
      localStorage.setItem("mentor_custom_tasks", JSON.stringify(updated));
      return updated;
    });
  };

  const addCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomLabel.trim()) return;
    const newTask = {
      id: `custom-${Date.now()}`,
      label: newCustomLabel.trim(),
      done: false
    };
    setCustomTasks(prev => {
      const updated = [...prev, newTask];
      localStorage.setItem("mentor_custom_tasks", JSON.stringify(updated));
      return updated;
    });
    setNewCustomLabel("");
  };

  const deleteCustomTask = (id: string) => {
    setCustomTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem("mentor_custom_tasks", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
        <ListTodo className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-800">Action Item Todo List</h3>
      </div>
      <div className="space-y-3 select-none max-h-[180px] overflow-y-auto pr-1">
        {/* Render Auto Tasks */}
        {autoTasks.map((task) => {
          const isDone = checkedAutoIds.includes(task.id);
          return (
            <div key={task.id} className="flex items-start gap-3 text-xs leading-normal">
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleAutoTask(task.id)}
                className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              {task.type === "link" ? (
                <Link 
                  href="/mentor-dashboard/approvals" 
                  className={`font-bold hover:underline transition-all ${isDone ? "line-through text-slate-400 font-semibold" : "text-amber-700 hover:text-amber-800"}`}
                >
                  {task.label}
                </Link>
              ) : (
                <span className={`font-semibold text-slate-700 transition-all ${isDone ? "line-through text-slate-400" : ""}`}>
                  {task.label}
                </span>
              )}
            </div>
          );
        })}

        {/* Render Custom Tasks */}
        {customTasks.map((task) => (
          <div key={task.id} className="flex items-start justify-between gap-3 text-xs leading-normal group/task">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleCustomTask(task.id)}
                className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className={`font-semibold text-slate-700 transition-all ${task.done ? "line-through text-slate-400" : ""}`}>
                {task.label}
              </span>
            </div>
            <button
              onClick={() => deleteCustomTask(task.id)}
              className="opacity-0 group-hover/task:opacity-100 text-slate-400 hover:text-rose-500 transition-all cursor-pointer p-0.5 rounded-lg hover:bg-slate-50 shrink-0"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {autoTasks.length === 0 && customTasks.length === 0 && (
          <p className="text-center text-slate-400 italic py-4">No tasks in your list.</p>
        )}
      </div>

      <form onSubmit={addCustomTask} className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <input
          type="text"
          placeholder="Add custom task..."
          value={newCustomLabel}
          onChange={(e) => setNewCustomLabel(e.target.value)}
          className="flex-1 text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-400 transition-all placeholder:text-slate-400 text-slate-700"
        />
        <button
          type="submit"
          className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
          title="Add task"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

function RecentActivityCard({ mentees, meetings, pendingApprovals }: { mentees: any[], meetings: any[], pendingApprovals: any }) {
  const activityItems = useMemo(() => {
    const list: Array<{ id: string; text: string; date: Date; icon: string; badge: string }> = [];

    (pendingApprovals?.academics || []).forEach((acad: any) => {
      const match = mentees.find(m => m.$id === acad.studentId || m.fullName === acad.studentName);
      if (match) {
        list.push({
          id: `acad-${acad.$id}`,
          text: `${match.fullName} submitted Semester ${acad.semester} SPI marksheets for verification.`,
          date: acad.$createdAt ? new Date(acad.$createdAt) : new Date(Date.now() - 4 * 3600000),
          icon: "acad",
          badge: "bg-blue-50 text-blue-700 border-blue-100"
        });
      }
    });

    (pendingApprovals?.achievements || []).forEach((ach: any) => {
      const match = mentees.find(m => m.$id === ach.studentId || m.fullName === ach.studentName);
      if (match) {
        list.push({
          id: `ach-${ach.$id}`,
          text: `${match.fullName} submitted "${ach.title || ach.category}" achievement certificate.`,
          date: ach.$createdAt ? new Date(ach.$createdAt) : new Date(Date.now() - 8 * 3600000),
          icon: "ach",
          badge: "bg-amber-50 text-amber-700 border-amber-100"
        });
      }
    });

    (meetings || []).slice(0, 5).forEach((meet: any) => {
      list.push({
        id: `meet-${meet.$id}`,
        text: `Mentorship session logged with ${meet.studentName || "mentee"} on topic "${meet.topic || "Discussion"}".`,
        date: meet.date ? new Date(meet.date) : new Date(Date.now() - 24 * 3600000),
        icon: "meet",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-100"
      });
    });

    if (list.length === 0) {
      list.push({
        id: "fb-1",
        text: "Roster initiated. All assigned mentees have updated their emergency contact logistics.",
        date: new Date(Date.now() - 48 * 3600000),
        icon: "init",
        badge: "bg-slate-100 text-slate-700 border-slate-200"
      });
    }

    return list.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 3);
  }, [mentees, meetings, pendingApprovals]);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
        <History className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-800">Recent Roster Activity</h3>
      </div>
      <div className="relative pl-4 space-y-4 border-l border-slate-100 ml-2">
        {activityItems.map((item) => (
          <div key={item.id} className="relative space-y-0.5">
            <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-white shadow-sm" />
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${item.badge}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold text-slate-400 select-none">
                {item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-705 leading-normal">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// DYNAMIC MONTHLY CALENDAR CARD
function CalendarCard({ meetings }: { meetings: any[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  
  const days = [];
  // Fill previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({ day: prevMonthTotalDays - i, isCurrentMonth: false });
  }
  // Fill current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push({ day: i, isCurrentMonth: true, isToday: i === today.getDate() });
  }
  // Fill next month days
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  // Highlight days with scheduled meetings
  const meetingDates = new Set(
    meetings
      .map(m => m.date)
      .filter(Boolean)
      .map(d => {
        const parts = d.split("-");
        if (parts.length === 3) {
          return `${Number(parts[0])}-${Number(parts[1])}-${Number(parts[2])}`;
        }
        return "";
      })
  );

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300 select-none">
      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">School Calendar</h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
          {monthNames[month]} {year}
        </span>
      </div>
      
      <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold">
        {days.map((d, idx) => {
          const hasMeeting = d.isCurrentMonth && meetingDates.has(`${year}-${month + 1}-${d.day}`);
          return (
            <div key={idx} className="flex justify-center items-center relative py-1">
              <span className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all ${
                d.isToday
                  ? "bg-slate-900 text-white font-bold shadow-sm"
                  : d.isCurrentMonth
                    ? "text-slate-700 hover:bg-slate-50"
                    : "text-slate-350"
              }`}>
                {d.day}
              </span>
              {hasMeeting && !d.isToday && (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// UPCOMING EVENTS CARD
function UpcomingEventsCard({ meetings }: { meetings: any[] }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Upcoming Events</h3>
        </div>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 border border-slate-150">
          Active Sessions
        </span>
      </div>

      {meetings.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
          No scheduled meetings
        </div>
      ) : (
        <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
          {meetings.slice(0, 3).map((meeting, idx) => {
            const colors = [
              "bg-amber-50/80 border-amber-100 text-amber-900",
              "bg-emerald-50/80 border-emerald-100 text-emerald-900",
              "bg-rose-50/80 border-rose-100 text-rose-900",
              "bg-indigo-50/80 border-indigo-100 text-indigo-900",
            ];
            const colorClass = colors[idx % colors.length];
            return (
              <div key={meeting.$id} className={`p-3.5 rounded-xl border ${colorClass} text-xs space-y-1.5 shadow-sm`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="truncate max-w-[130px]">{meeting.topic || "Mentorship Session"}</span>
                  <span className="text-[10px] opacity-75">
                    {meeting.date ? new Date(meeting.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                  </span>
                </div>
                <p className="opacity-90 leading-normal truncate">{meeting.description || "Roster review and guidance."}</p>
                {meeting.studentName && (
                  <p className="text-[10px] font-extrabold opacity-75 mt-1">Student: {meeting.studentName}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
