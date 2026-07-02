import { useEffect, useState } from "react";
import { getAcademicRecordsForProfile, getMenteeProfile } from "@/lib/actions/student.actions";
import DownloadTranscriptBtn from "@/components/DownloadTranscriptBtn";
import type { AcademicUploadRecord } from "@/types";

export default function AcademicsWidget({ profileId }: { profileId: string }) {
  const [academicRecords, setAcademicRecords] = useState<AcademicUploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      getMenteeProfile(profileId),
      getAcademicRecordsForProfile(profileId),
    ])
      .then(([, records]) => {
        if (active) setAcademicRecords((records || []) as AcademicUploadRecord[]);
      })
      .catch((error) => {
        console.error("Academics data fetch failed:", error);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [profileId]);

  const latestRecord = academicRecords[0] || null;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">Academic Performance</h2>
        <p className="text-slate-500 mt-1 font-medium">
          Track your semester results and overall progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Semester</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {latestRecord ? `Sem ${latestRecord.semester}` : "-"}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cumulative Performance (CPI)</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {latestRecord?.cpi || "-"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latest Semester (SPI)</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {latestRecord?.spi || "-"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Semester History</h3>
            <p className="text-xs text-slate-400">Official academic records logged in the system</p>
          </div>
          
          {/* Replaced standard HTML button with our Client Component */}
          <DownloadTranscriptBtn />
          
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Semester</th>
                <th className="px-6 py-4">SPI (Semester Perf.)</th>
                <th className="px-6 py-4">CPI (Cumulative Perf.)</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    Loading academic records...
                  </td>
                </tr>
              ) : academicRecords.length > 0 ? (
                academicRecords.map((record) => (
                  <tr key={record.$id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">Semester {record.semester}</td>
                    <td className="px-6 py-4 text-slate-600">{record.spi}</td>
                    <td className="px-6 py-4 font-medium text-blue-600">{record.cpi}</td>
                    <td className="px-6 py-4">
                      
                      {/* Dynamic Badge Rendering based on Appwrite 'status' string */}
                      {record.status === "Backlog" || record.status === "ATKT" ? (
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-md text-[11px] font-bold uppercase tracking-wider">
                          {record.status}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-md text-[11px] font-bold uppercase tracking-wider">
                          Cleared
                        </span>
                      )}

                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    No academic records found for this profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
