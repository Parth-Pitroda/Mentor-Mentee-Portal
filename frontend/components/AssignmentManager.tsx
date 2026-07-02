"use client";

import { useState } from "react";
import { assignMentor } from "@/lib/actions/student.actions";
import { useRouter } from "@/lib/router-compat";
import type { UserProfile } from "@/types";

type AssignmentManagerProps = {
  unassignedStudents: UserProfile[];
  availableMentors: UserProfile[];
};

export default function AssignmentManager({ unassignedStudents, availableMentors }: AssignmentManagerProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleAssign = async (studentId: string, mentorId: string) => {
    if (!mentorId) return; // Don't submit if they haven't selected a mentor
    
    setLoadingId(studentId);
    setError("");

    const result = await assignMentor(studentId, mentorId);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-lg">Pending Assignments</h3>
        <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">
          {unassignedStudents.length} Students Pending
        </span>
      </div>
      
      {error && <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Assign Mentor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {unassignedStudents.length > 0 ? (
              unassignedStudents.map((student) => (
                <tr key={student.$id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700">{student.fullName}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {student.department || "Not Specified"}
                  </td>
                  <td className="px-6 py-4">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleAssign(student.$id, formData.get("mentorId") as string);
                      }}
                      className="flex items-center gap-2"
                    >
                      <select 
                        name="mentorId" 
                        required
                        className="p-2 border border-slate-200 rounded-lg outline-none bg-white text-slate-700 min-w-[200px]"
                      >
                        <option value="">Select a Mentor...</option>
                        {availableMentors.map((mentor) => (
                          <option key={mentor.$id} value={mentor.$id}>
                            {mentor.fullName} ({mentor.department || "General"})
                          </option>
                        ))}
                      </select>
                      <button 
                        type="submit" 
                        disabled={loadingId === student.$id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {loadingId === student.$id ? "Assigning..." : "Assign"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-slate-400">
                  All students have been successfully assigned to a mentor! 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
