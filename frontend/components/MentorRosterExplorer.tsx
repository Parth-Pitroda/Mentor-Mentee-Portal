"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MenteeCard, { type MenteeCardStudent } from "@/components/MenteeCard";

type ViewMode = "all" | "top";
type SearchField = "all" | "name" | "rollNo" | "email" | "department" | "semester";


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

export default function MentorRosterExplorer({ mentees }: { mentees: MenteeCardStudent[] }) {
  const [query, setQuery] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  const rankedMentees = useMemo(() => {
    return [...mentees].sort((a, b) => {
      const scoreDelta = getScore(b) - getScore(a);
      if (scoreDelta !== 0) return scoreDelta;

      return normalize(a.fullName).localeCompare(normalize(b.fullName));
    });
  }, [mentees]);

  const topPerformers = useMemo(() => {
    return rankedMentees.filter((mentee) => getScore(mentee) > 0).slice(0, 5);
  }, [rankedMentees]);

  const visibleMentees = useMemo(() => {
    const source = viewMode === "top" ? topPerformers : mentees;
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
        semester: mentee.semester,
      };

      return normalize(fieldMap[searchField]).includes(search);
    });
  }, [mentees, query, searchField, topPerformers, viewMode]);

  const stats = useMemo(() => {
    const cgpas = mentees
      .map(m => Number(m.cgpa || m.latestCpi || m.latestSpi || 0))
      .filter(val => val > 0);
    const avgCgpa = cgpas.length > 0
      ? (cgpas.reduce((sum, val) => sum + val, 0) / cgpas.length).toFixed(2)
      : "N/A";
    const highPerformers = mentees.filter(m => {
      const score = Number(m.cgpa || m.latestCpi || m.latestSpi || 0);
      return score >= 8.0;
    }).length;
    return {
      total: mentees.length,
      avgCgpa,
      highPerformers,
    };
  }, [mentees]);

  return (
    <div className="space-y-6">
      {/* Roster Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Mentees</p>
            <h3 className="mt-1 text-3xl font-black text-slate-900">{stats.total}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average CGPA</p>
            <h3 className="mt-1 text-3xl font-black text-slate-900">{stats.avgCgpa}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">High Performers (≥ 8.0)</p>
            <h3 className="mt-1 text-3xl font-black text-slate-900">{stats.highPerformers}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0110 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0114 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mentee-search" className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Search Mentees
            </label>
            <div className="flex gap-2">
              <select
                id="mentee-search-field"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as SearchField)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Fields</option>
                <option value="name">Name</option>
                <option value="rollNo">Roll Number</option>
                <option value="email">Email</option>
                <option value="department">Department</option>
                <option value="semester">Semester</option>
              </select>
              <input
                id="mentee-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  searchField === "all"
                    ? "Search by name, roll number, email, etc."
                    : `Search by ${searchField}...`
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex w-full rounded-lg border border-slate-200 bg-slate-100 p-1 lg:w-fit">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded-md px-4 py-2 text-sm font-bold transition ${
                viewMode === "all" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setViewMode("top")}
              className={`rounded-md px-4 py-2 text-sm font-bold transition ${
                viewMode === "top" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Top
            </button>
          </div>
        </div>
      </div>

      {topPerformers.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">Top Performing Mentees</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Highest academic scores under your guidance</h2>
            </div>
            <span className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-bold text-green-700">
              {topPerformers.length} ranked
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {topPerformers.map((mentee, index) => (
              <Link
                key={mentee.$id}
                href={`?tab=student-profile&id=${mentee.$id}`}
                className="rounded-lg border border-green-100 bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{mentee.fullName || "Unnamed Student"}</p>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">{mentee.rollNo || mentee.department || "No roll number"}</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-100 text-xs font-black text-green-700">
                    {index + 1}
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {mentee.performanceSource || "Score"}
                    </p>
                    <p className="text-2xl font-black text-green-700">{getScore(mentee).toFixed(2)}</p>
                  </div>
                  {mentee.latestAcademicSemester && (
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                      Sem {mentee.latestAcademicSemester}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {visibleMentees.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-lg font-bold text-slate-800">No matching mentees</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">Adjust the search or switch back to the full roster.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleMentees.map((mentee) => (
            <MenteeCard key={mentee.$id} student={mentee} />
          ))}
        </div>
      )}
    </div>
  );
}
