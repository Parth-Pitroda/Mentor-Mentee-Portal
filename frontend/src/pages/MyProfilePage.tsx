import { useOutletContext } from "react-router-dom";
import { useAsyncData } from "@/src/hooks/useAsyncData";
import { getDashboardOverview } from "@/lib/actions/student.actions";
import { getFileViewUrl } from "@/lib/files";
import LoadingPage from "@/src/components/LoadingPage";
import ErrorPanel from "@/src/components/ErrorPanel";
import type { DashboardContext } from "@/src/types/app.types";

function getInitials(name?: string) {
  if (!name) return "S";
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function MyProfilePage() {
  const { profileId, user } = useOutletContext<DashboardContext>();
  const state = useAsyncData(async () => getDashboardOverview(profileId), [profileId]);
  const overview = state.data as any;

  if (state.loading) return <LoadingPage label="Loading profile..." />;
  if (!overview?.profile) return <ErrorPanel message="Profile information could not be loaded." />;

  const student = overview.profile;
  const mentorName = overview.mentor?.fullName || "Pending Assignment";

  return (
    <div className="w-full animate-in fade-in duration-500 select-none">
      {/* --- MAIN GRID SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        
        {/* --- LEFT SECTION: GENERAL TEXT DETAILS --- */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-5 border-b border-slate-200 pb-2">Profile Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1.5">
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Course</span>
                <span className="text-slate-900 font-extrabold">{student.department || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Full Name</span>
                <span className="text-slate-900 font-extrabold">{student.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Roll Number</span>
                <span className="text-slate-900 font-extrabold">{student.rollNo || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Semester</span>
                <span className="text-slate-950 font-extrabold">Semester {student.semester || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Father&apos;s Name</span>
                <span className="text-slate-900 font-extrabold">{student.fatherName || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Mother&apos;s Name</span>
                <span className="text-slate-900 font-extrabold">{student.motherName || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Email Address</span>
                <span className="text-slate-900 font-extrabold">{student.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Phone Number</span>
                <span className="text-slate-900 font-extrabold">{student.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Residential Status</span>
                <span className="text-slate-900 font-extrabold">{student.residentialStatus || "Day Scholar"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Blood Group</span>
                <span className="text-slate-900 font-extrabold">{student.bloodGroup || "Unknown"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Father&apos;s Phone</span>
                <span className="text-slate-900 font-extrabold">{student.fatherPhone || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Mother&apos;s Phone</span>
                <span className="text-slate-900 font-extrabold">{student.motherPhone || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm sm:col-span-2">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Primary Mentor</span>
                <span className="text-blue-700 font-extrabold">{mentorName}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200/80 text-sm sm:col-span-2">
                <span className="text-slate-500 text-xs font-bold tracking-wider uppercase">Technical Interests</span>
                <span className="text-slate-900 font-extrabold text-right max-w-[75%] truncate">{student.interests || "No interests specified."}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT SECTION: BIG IMAGE, DETAILS & ACTION (Borderless) --- */}
        <div className="md:col-span-1 space-y-4 md:border-l md:border-slate-100 md:pl-10">
          <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
            {student.profilePictureId ? (
              <img 
                src={getFileViewUrl(student.profilePictureId)}
                alt={`${student.fullName} Profile`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-white text-5xl font-black">
                {getInitials(student.fullName)}
              </div>
            )}
          </div>

          {/* Student Details under the photo */}
          <div className="space-y-1.5 pt-2 select-none">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{student.fullName}</h2>
            <div className="flex flex-col gap-1 text-slate-500 text-xs font-semibold">
              <p>Student ID : <b className="text-slate-800 font-bold">{student.rollNo || "N/A"}</b></p>
              <p>Department : <b className="text-slate-800 font-bold">{student.department || "N/A"}</b></p>
              <div className="pt-1">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold uppercase text-[9px] tracking-wider border ${
                  student.isVerified 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                    : 'bg-amber-50 border-amber-100 text-amber-700'
                }`}>
                  {student.isVerified ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Verified
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Pending Verification
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
