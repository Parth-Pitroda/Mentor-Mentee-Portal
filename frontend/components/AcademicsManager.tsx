"use client";

import { useState, useEffect } from "react";
import { uploadAcademicRecord, updateAcademicStatus } from "@/lib/actions/student.actions";
import StyledFileInput from "@/components/StyledFileInput";
import { useRouter } from "next/navigation"; 
import { getFileViewUrl, getFileDownloadUrl } from "@/lib/files";
import type { AcademicUploadRecord } from "@/types";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  FileText,
  X
} from "lucide-react";

type AcademicsManagerProps = {
  initialRecords: AcademicUploadRecord[];
  profileId: string;
  isMentor: boolean;
};

export default function AcademicsManager({ initialRecords, profileId, isMentor }: AcademicsManagerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  
  // Sub-navigation view: "dashboard" or "upload"
  const [activeView, setActiveView] = useState<"dashboard" | "upload">("dashboard");

  // State for inline document preview modal
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [previewSemester, setPreviewSemester] = useState<number | null>(null);

  // Safety client mount check to prevent SSR hydration warnings from Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await uploadAcademicRecord(formData, profileId);

    if (result.success) {
      router.refresh();
      (e.target as HTMLFormElement).reset();
      setIsLoading(false);
      setActiveView("dashboard"); // Auto switch back to dashboard on successful upload
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

  // --- DATA CALCULATIONS ---
  const verifiedRecords = initialRecords.filter(r => r.status === "Verified");
  const sortedVerified = [...verifiedRecords].sort((a, b) => Number(a.semester) - Number(b.semester));

  const highestSPI = verifiedRecords.length > 0 
    ? Math.max(...verifiedRecords.map(r => Number(r.spi) || 0)) 
    : 0;

  const currentCPI = sortedVerified.length > 0 
    ? Number(sortedVerified[sortedVerified.length - 1].cpi) || 0 
    : 0;

  const completedCount = verifiedRecords.length;

  // --- RECHARTS PROGRESS GRAPH DATA ---
  const chartData = sortedVerified.map(r => ({
    name: `Sem ${r.semester}`,
    SPI: Number(r.spi) || 0,
    CPI: Number(r.cpi) || 0,
  }));

  // Custom Chart Tooltip styling (increased text size for readability)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-800 p-4 rounded-xl shadow-xl text-sm space-y-1.5">
          <p className="font-bold text-slate-200">{payload[0].payload.name}</p>
          <div className="space-y-1">
            <p className="text-blue-400 font-semibold">SPI: <span className="text-white font-black">{payload[0].value.toFixed(2)}</span></p>
            {payload[1] && (
              <p className="text-indigo-400 font-semibold">CPI: <span className="text-white font-black">{payload[1].value.toFixed(2)}</span></p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 selection:bg-slate-900 selection:text-white">
      
      {/* ================= SECTION 1: SUB-NAVIGATION NAV BAR (Only for Students) ================= */}
      {!isMentor && (
        <div className="flex border-b border-slate-200/60 pb-px">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeView === "dashboard"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-655"
            }`}
          >
            Academic Dashboard
          </button>
          <button
            onClick={() => setActiveView("upload")}
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeView === "upload"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-655"
            }`}
          >
            Upload Marksheet
          </button>
        </div>
      )}

      {/* ================= SECTION 2: VIEW CONTENT SWITCH ================= */}
      {(activeView === "dashboard" || isMentor) ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* ================= TIMELINE ROADMAP (Now part of Academic Dashboard) ================= */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="font-bold text-slate-900 text-lg md:text-xl tracking-tight">Academic Journey</h3>
                <p className="text-sm text-slate-500 mt-1">Timeline representation of your semester verification records</p>
              </div>
              
              {/* Key inline stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-5 py-3">
                <span>CPI: <strong className="text-slate-900 text-base font-extrabold">{currentCPI.toFixed(2)}</strong></span>
                <span className="text-slate-200">|</span>
                <span>Peak SPI: <strong className="text-slate-900 text-base font-extrabold">{highestSPI.toFixed(2)}</strong></span>
                <span className="text-slate-200">|</span>
                <span>Completed: <strong className="text-slate-900 text-base font-extrabold">{completedCount}/8 Terms</strong></span>
              </div>
            </div>

            {/* Milestone stepper */}
            <div className="relative flex items-center justify-between w-full px-2 overflow-x-auto pb-4">
              {Array.from({ length: 8 }).map((_, idx) => {
                const sem = idx + 1;
                const record = initialRecords.find(r => Number(r.semester) === sem);
                const status = record ? record.status : "Empty";
                
                const showLine = sem < 8;
                const nextRecord = initialRecords.find(r => Number(r.semester) === sem + 1);
                const isLineActive = record?.status === "Verified" && nextRecord?.status === "Verified";

                return (
                  <div key={sem} className="flex flex-col items-center flex-1 min-w-[80px] relative">
                    
                    {/* Stepper node circle */}
                    <div className={`z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-black transition-all duration-300 shadow-sm ${
                      status === "Verified" ? "bg-emerald-500 border-emerald-500 text-white" :
                      status === "Pending" ? "bg-amber-500 border-amber-500 text-white animate-pulse" :
                      status === "Rejected" ? "bg-red-500 border-red-500 text-white" :
                      "bg-white border-slate-200 text-slate-400"
                    }`} title={record ? `Semester ${sem}: ${status}` : `Semester ${sem}: Empty`}>
                      {status === "Verified" && <CheckCircle2 className="w-6 h-6" />}
                      {status === "Pending" && <Clock className="w-6 h-6" />}
                      {status === "Rejected" && <XCircle className="w-6 h-6" />}
                      {status === "Empty" && sem}
                    </div>

                    <span className="text-xs font-bold text-slate-550 mt-3">Sem {sem}</span>

                    {/* Progress connection line */}
                    {showLine && (
                      <div className={`absolute top-5.5 left-1/2 w-full h-[2px] -translate-y-1/2 -z-0 transition-colors duration-300 ${
                        isLineActive ? "bg-emerald-500" : "bg-slate-100"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* OFFICIAL TRANSCRIPTS TABLE CARD (Occupies full page width) */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Verified Academic Records</h3>
              <p className="text-sm text-slate-500 mt-1">Official semester marksheets and verification standing</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-slate-550 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4.5">Semester</th>
                    <th className="px-6 py-4.5">SPI</th>
                    <th className="px-6 py-4.5">CPI</th>
                    <th className="px-6 py-4.5">Status</th>
                    <th className="px-6 py-4.5">Document</th>
                    {isMentor && <th className="px-6 py-4.5 text-right">Mentor Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {initialRecords.length > 0 ? (
                    initialRecords.map((record) => (
                      <tr key={record.$id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4.5 font-bold text-slate-800">Sem {record.semester}</td>
                        <td className="px-6 py-4.5">{record.spi}</td>
                        <td className="px-6 py-4.5">{record.cpi}</td>
                        <td className="px-6 py-4.5">
                          <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                            record.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            record.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          {record.fileId ? (
                            <button 
                              onClick={() => {
                                setPreviewFileId(record.fileId || null);
                                setPreviewSemester(Number(record.semester));
                              }}
                              className="text-blue-600 hover:underline font-extrabold text-left cursor-pointer"
                            >
                              📄 View File
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">No File</span>
                          )}
                        </td>
                        
                        {/* MENTOR VERIFICATION CONTROLS */}
                        {isMentor && (
                          <td className="px-6 py-4.5 text-right">
                            {record.status === 'Pending' ? (
                               <div className="flex justify-end gap-2.5">
                                 <button onClick={() => handleVerification(record.$id, "Verified")} disabled={isLoading} className="px-3.5 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 text-xs transition-colors cursor-pointer shadow-sm">Verify</button>
                                 <button onClick={() => handleVerification(record.$id, "Rejected")} disabled={isLoading} className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 text-xs transition-colors cursor-pointer">Reject</button>
                               </div>
                            ) : (
                              <span className="text-slate-455 italic text-xs">Reviewed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isMentor ? 6 : 5} className="px-6 py-16 text-center text-slate-400 font-medium">No transcripts uploaded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DUAL INTERACTIVE PROGRESS CHARTS CARD (Occupies full width) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Chart 1: SPI Progress */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
                <span>Semester SPI Progression</span>
              </h4>
              
              <div className="min-h-[260px] flex items-center justify-center">
                {mounted && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSPI" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke="#94a3b8" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="SPI" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSPI)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm font-medium">
                    No verified records. Verified semester results will generate the SPI progression.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: CPI Progress */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
                <span>Cumulative CPI Progression</span>
              </h4>
              
              <div className="min-h-[260px] flex items-center justify-center">
                {mounted && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCPI" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke="#94a3b8" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="CPI" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCPI)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm font-medium">
                    No verified records. Verified semester results will generate the CPI progression.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= UPLOAD VIEW (Student only - Integrated page content view) ================= */
        <div className="space-y-6 animate-in fade-in duration-300">


          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
            <form onSubmit={handleUpload} className="space-y-6">
              {error && <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-650 border border-red-100">{error}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-405 uppercase tracking-widest mb-2.5">Semester Term</label>
                  <input required name="semester" type="number" min="1" max="8" className="w-full rounded-xl border border-slate-200 bg-white p-3.5 outline-none text-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-850 transition-all font-semibold" placeholder="e.g. 3" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-405 uppercase tracking-widest mb-2.5">SPI</label>
                  <input required name="spi" type="number" step="0.01" min="0" max="10" className="w-full rounded-xl border border-slate-200 bg-white p-3.5 outline-none text-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-855 transition-all font-semibold" placeholder="e.g. 8.50" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-405 uppercase tracking-widest mb-2.5">CPI</label>
                  <input required name="cpi" type="number" step="0.01" min="0" max="10" className="w-full rounded-xl border border-slate-200 bg-white p-3.5 outline-none text-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-855 transition-all font-semibold" placeholder="e.g. 8.20" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-405 uppercase tracking-widest mb-2.5">Attach Marksheet Document</label>
                <StyledFileInput name="file" accept="image/*,.pdf" required label="Select Marksheet (PDF/Image)" />
              </div>

              <div className="flex justify-end pt-4">
                <button disabled={isLoading} type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 px-8 py-3.5 font-bold text-white text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                  {isLoading ? "Securely Uploading..." : "Submit For Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= INLINE QUICK PREVIEW MODAL ================= */}
      {previewFileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm md:text-base">Document Preview</h4>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Semester {previewSemester} Marksheet</p>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href={getFileDownloadUrl(previewFileId)} 
                  download={`Semester_${previewSemester}_Marksheet`}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  Download
                </a>
                <button 
                  onClick={() => {
                    setPreviewFileId(null);
                    setPreviewSemester(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Content Iframe */}
            <div className="flex-1 bg-slate-50 relative">
              <iframe 
                src={getFileViewUrl(previewFileId)} 
                className="w-full h-full border-none"
                title={`Semester ${previewSemester} Marksheet Preview`}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
