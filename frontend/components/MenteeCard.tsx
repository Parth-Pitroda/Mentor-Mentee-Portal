import Link from "next/link";
import { getFileViewUrl } from "@/lib/files";

export type MenteeCardStudent = {
  $id: string;
  fullName?: string;
  email?: string;
  department?: string;
  rollNo?: string;
  semester?: string | number;
  cgpa?: string | number;
  latestCpi?: string | number;
  latestSpi?: string | number;
  latestAcademicSemester?: string | number;
  performanceScore?: number;
  performanceSource?: string;
  profilePictureId?: string;
};

export default function MenteeCard({ student }: { student: MenteeCardStudent }) {
  // Helper to grab initials (e.g., "Rahul Sharma" -> "RS")
  const getInitials = (name?: string) => {
    if (!name) return "S";
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const performanceScore = Number(student.performanceScore || 0);

  return (
    <Link 
      href={`?tab=student-profile&id=${student.$id}`}
      className="group relative flex cursor-pointer flex-col items-center overflow-hidden rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md"
    >
      
      {/* --- AVATAR --- */}
      {/* Added group-hover:scale-105 so the image slightly zooms when hovering the card */}
      <div className="relative z-10 mb-4 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-blue-100 bg-blue-50 text-xl font-bold text-blue-600 shadow-sm transition-colors group-hover:bg-blue-100">
        {student.profilePictureId ? (
          <img 
            src={getFileViewUrl(student.profilePictureId)}
            alt={`${student.fullName} Profile`}
            className="w-full h-full object-cover"
          />
        ) : (
          getInitials(student.fullName)
        )}
      </div>

      {/* --- DETAILS --- */}
      <div className="z-10 w-full">
        <h3 className="truncate px-2 text-base font-bold text-slate-800 transition-colors group-hover:text-blue-700" title={student.fullName}>
          {student.fullName || "Unnamed Student"}
        </h3>
        <p className="mb-3 truncate px-2 text-sm text-slate-500" title={student.email}>
          {student.email}
        </p>

        {performanceScore > 0 && (
          <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
            <span>{student.performanceSource || "Score"}</span>
            <span>{performanceScore.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
            {student.department || "Unassigned"}
          </div>
          {student.rollNo && (
            <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
              {student.rollNo}
            </div>
          )}
          {student.semester && (
            <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
              Sem {student.semester}
            </div>
          )}
        </div>
      </div>

    </Link>
  );
}
