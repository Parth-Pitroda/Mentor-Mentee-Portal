"use client";

import { useState } from "react";
import { uploadAcademicRecord, updateAcademicStatus } from "@/lib/actions/student.actions";
import StyledFileInput from "@/components/StyledFileInput";
import { useRouter } from "next/navigation"; 
import { getFileViewUrl } from "@/lib/files";
import type { AcademicUploadRecord } from "@/types";

type AcademicsManagerProps = {
  initialRecords: AcademicUploadRecord[];
  profileId: string;
  isMentor: boolean;
};

export default function AcademicsManager({ initialRecords, profileId, isMentor }: AcademicsManagerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await uploadAcademicRecord(formData, profileId);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const handleVerification = async (recordId: string, status: "Verified" | "Rejected") => {
    setIsLoading(true);
    await updateAcademicStatus(recordId, status, profileId);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* 1. MENTEE UPLOAD FORM (Hidden from Mentors) */}
      {!isMentor && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-800">Upload Semester Results</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Semester</label>
                <input required name="semester" type="number" min="1" max="8" className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 3" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SPI (Current)</label>
                <input required name="spi" type="number" step="0.01" min="0" max="10" className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 8.5" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPI (Cumulative)</label>
                <input required name="cpi" type="number" step="0.01" min="0" max="10" className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 8.2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marksheet Document (PDF/Image)</label>
              <StyledFileInput name="file" accept="image/*,.pdf" required label="Choose marksheet" />
            </div>

            <button disabled={isLoading} type="submit" className="rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? "Uploading securely..." : "Submit for Verification"}
            </button>
          </form>
        </div>
      )}

      {/* 2. ACADEMIC RECORDS TABLE */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">Official Academic Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Semester</th>
                <th className="px-6 py-4">SPI / CPI</th>
                <th className="px-6 py-4">Document</th>
                <th className="px-6 py-4">Status</th>
                {isMentor && <th className="px-6 py-4 text-right">Mentor Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialRecords.length > 0 ? (
                initialRecords.map((record) => (
                  <tr key={record.$id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-700">Sem {record.semester}</td>
                    <td className="px-6 py-4 text-slate-600">SPI: {record.spi} <br/> CPI: {record.cpi}</td>
                    <td className="px-6 py-4">
                      {record.fileId ? (
                        <a href={getFileViewUrl(record.fileId)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                          📄 View File
                        </a>
                      ) : "No File"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                        record.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' : 
                        record.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-yellow-50 text-yellow-700 border-yellow-100'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    
                    {/* 3. MENTOR VERIFICATION CONTROLS */}
                    {isMentor && (
                      <td className="px-6 py-4 text-right">
                        {record.status === 'Pending' ? (
                           <div className="flex justify-end gap-2">
                             <button onClick={() => handleVerification(record.$id, "Verified")} disabled={isLoading} className="px-3 py-1.5 bg-green-100 text-green-700 font-bold rounded hover:bg-green-200 text-xs">Verify</button>
                             <button onClick={() => handleVerification(record.$id, "Rejected")} disabled={isLoading} className="px-3 py-1.5 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200 text-xs">Reject</button>
                           </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Reviewed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isMentor ? 5 : 4} className="px-6 py-10 text-center text-slate-400">No academic records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
