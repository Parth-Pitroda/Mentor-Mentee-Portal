import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import MentorNotesEditor from "@/components/MentorNotesEditor";
import AchievementsWidget from "@/components/dashboard/AchievementsWidget";
import { getFileViewUrl } from "@/lib/files";
import { toggleStudentVerification } from "@/lib/actions/student.actions";
import { initials } from "@/src/utils/routing";
import StatCard from "./StatCard";
import type { UserProfile, AchievementRecord, Meeting } from "@/types";
import type { User } from "@/src/types/app.types";

export default function StudentDossier({ student, latestAcademicRecord, achievementRecords, mentorNote }: { student: UserProfile; user: User; latestAcademicRecord?: any; achievementRecords?: AchievementRecord[]; mentorNote?: any }) {
  const studentMeetings = [] as Meeting[];

  async function verify() {
    await toggleStudentVerification(student.$id, Boolean(student.isVerified));
  }

  return (
    <div className="space-y-8">
      <Link to="?tab=roster" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ChevronLeft className="h-4 w-4" /> Back to Roster
      </Link>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          <div>
            <h3 className="mb-5 border-b border-slate-200 pb-2 text-sm font-extrabold uppercase tracking-wider text-slate-800">Profile Information</h3>
            <div className="grid grid-cols-1 gap-x-12 gap-y-1.5 sm:grid-cols-2">
              {[
                ["Course", student.department || "N/A"],
                ["Full Name", student.fullName],
                ["Roll Number", student.rollNo || "N/A"],
                ["Semester", student.semester ? `Semester ${student.semester}` : "N/A"],
                ["Email Address", student.email],
                ["Phone Number", student.phone || "N/A"],
                ["Residential Status", student.residentialStatus || "Day Scholar"],
                ["Blood Group", student.bloodGroup || "Unknown"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-dashed border-slate-200/80 py-3 text-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
                  <span className="font-extrabold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <MentorNotesEditor studentId={student.$id} initialContent={mentorNote?.content || ""} initialCollectionMissing={!!mentorNote?.collectionMissing} />
        </div>

        <div className="space-y-4 md:border-l md:border-slate-100 md:pl-10">
          <div className="h-80 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            {student.profilePictureId ? (
              <img src={getFileViewUrl(student.profilePictureId)} alt={`${student.fullName} Profile`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-5xl font-black text-white">{initials(student.fullName)}</div>
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">{student.fullName}</h2>
          <p className="text-xs font-semibold text-slate-500">Student ID: <b className="text-slate-800">{student.rollNo || "N/A"}</b></p>
          {!student.isVerified && (
            <button onClick={verify} className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800">
              Mark as Verified
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 border-t border-slate-200 pt-6 md:grid-cols-3">
        <StatCard label="Current CGPA" value={student.cgpa !== undefined && student.cgpa !== null && student.cgpa !== "" ? Number(student.cgpa).toFixed(2) : "N/A"} />
        <StatCard label="Latest SPI" value={latestAcademicRecord?.spi !== undefined && latestAcademicRecord?.spi !== null && latestAcademicRecord?.spi !== "" ? Number(latestAcademicRecord.spi).toFixed(2) : "N/A"} />
        <StatCard label="Total Meetings" value={studentMeetings.length} />
      </div>
      <AchievementsWidget studentId={student.$id} initialData={achievementRecords || []} />
    </div>
  );
}
