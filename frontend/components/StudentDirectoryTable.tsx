"use client";

import { useState } from "react";

interface EnrichedStudent {
  $id: string;
  fullName: string;
  email: string;
  phone: string;
  rollNo: string;
  department: string;
  semester: string | number;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  mentorPhone: string;
}

export default function StudentDirectoryTable({ students }: { students: EnrichedStudent[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.fullName?.toLowerCase().includes(query) ||
      student.rollNo?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.department?.toLowerCase().includes(query) ||
      student.mentorName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header section with live search and statistics */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Student Directory</h2>
          <p className="text-sm text-slate-500">
            Showing {filteredStudents.length} of {students.length} students across the portal
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by student, roll no, department, mentor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Student Info</th>
              <th className="px-6 py-4">Contact Info</th>
              <th className="px-6 py-4">Academics</th>
              <th className="px-6 py-4">Assigned Mentor</th>
              <th className="px-6 py-4">Mentor Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                  No students found matching &quot;{searchQuery}&quot;
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.$id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Student Info */}
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{student.fullName}</p>
                    <p className="text-xs font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 inline-block mt-1">
                      Roll No: {student.rollNo || "N/A"}
                    </p>
                  </td>

                  {/* Student Contact */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <a
                        href={`mailto:${student.email}`}
                        className="text-blue-600 hover:underline flex items-center gap-1.5 text-xs"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {student.email}
                      </a>
                      {student.phone && (
                        <a
                          href={`tel:${student.phone}`}
                          className="text-slate-600 hover:text-blue-600 flex items-center gap-1.5 text-xs"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {student.phone}
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Academics info */}
                  <td className="px-6 py-4">
                    <p className="text-slate-800 font-medium">{student.department || "Unassigned"}</p>
                    {student.semester && (
                      <p className="text-xs text-slate-500 mt-0.5">Sem: {student.semester}</p>
                    )}
                  </td>

                  {/* Mentor Info */}
                  <td className="px-6 py-4">
                    {student.mentorId ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs uppercase animate-pulse-subtle">
                          {student.mentorName.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{student.mentorName}</p>
                          <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Mentor
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No assigned mentor</span>
                    )}
                  </td>

                  {/* Mentor Contact Info */}
                  <td className="px-6 py-4">
                    {student.mentorId && (
                      <div className="flex flex-col gap-1">
                        {student.mentorEmail && (
                          <a
                            href={`mailto:${student.mentorEmail}`}
                            className="text-blue-600 hover:underline flex items-center gap-1.5 text-xs"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {student.mentorEmail}
                          </a>
                        )}
                        {student.mentorPhone && (
                          <a
                            href={`tel:${student.mentorPhone}`}
                            className="text-slate-600 hover:text-blue-600 flex items-center gap-1.5 text-xs"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {student.mentorPhone}
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
