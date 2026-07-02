"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/router-compat";
import { 
  respondToMeetingRequest, 
  updateAcademicStatus, 
  updateAchievementStatus, 
  updateMeetingStatus 
} from "@/lib/actions/student.actions";
import { getFileViewUrl } from "@/lib/files";
import { 
  Check, 
  X, 
  Eye, 
  Loader2, 
  ExternalLink, 
  CalendarClock, 
  BookOpen, 
  Award,
  FileText
} from "lucide-react";

type ApprovalCardActionsProps = {
  recordId: string;
  studentId: string;
  studentName: string;
  type: "request" | "academic" | "achievement" | "meeting";
  fileId?: string;
  title: string;
  description: string;
  extraDetails?: {
    cpi?: string | number;
    spi?: string | number;
    semester?: string | number;
    proposedDate?: string;
    proposedTime?: string;
    topic?: string;
  };
};

export default function ApprovalCardActions({
  recordId,
  studentId,
  studentName,
  type,
  fileId,
  title,
  description,
  extraDetails
}: ApprovalCardActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"Accept" | "Reject" | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleAction = async (action: "Accept" | "Reject") => {
    setActionType(action);
    startTransition(async () => {
      try {
        if (type === "request") {
          await respondToMeetingRequest(recordId, action === "Accept" ? "Confirmed" : "Rejected");
        } else if (type === "academic") {
          await updateAcademicStatus(recordId, action === "Accept" ? "Verified" : "Rejected", studentId);
        } else if (type === "achievement") {
          await updateAchievementStatus(recordId, action === "Accept" ? "Verified" : "Rejected", studentId);
        } else if (type === "meeting") {
          await updateMeetingStatus(recordId, action === "Accept" ? "Verified" : "Rejected", studentId);
        }
        
        router.refresh();
        setIsPreviewOpen(false);
      } catch (err) {
        console.error("Action execution failed:", err);
      } finally {
        setActionType(null);
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const fileUrl = fileId ? getFileViewUrl(fileId) : null;

  return (
    <>
      {/* 1. COMPACT ACTION CONTROLS ON THE QUEUE CARD */}
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:scale-[1.02] hover:border-slate-350 hover:bg-slate-55 active:scale-[0.98] cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          Open Preview
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => handleAction("Accept")}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 cursor-pointer min-w-[85px] justify-center"
        >
          {isPending && actionType === "Accept" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {type === "request" ? "Confirm" : "Verify"}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => handleAction("Reject")}
          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 transition-all hover:scale-[1.02] hover:bg-rose-100/50 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {isPending && actionType === "Reject" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Reject
        </button>
      </div>

      {/* 2. PREMIUM PREVIEW MODAL PANEL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-200">
          <div 
            className="fixed inset-0" 
            onClick={() => !isPending && setIsPreviewOpen(false)} 
          />
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col md:flex-row overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 relative z-10">
            
            {/* Left Column: File View Iframe / Visual Card */}
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-200 relative min-h-[40vh] md:min-h-0">
              {fileUrl ? (
                <>
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-white transition-all flex items-center gap-1.5 z-10"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in New Tab
                  </a>
                  <iframe 
                    src={fileUrl} 
                    className="w-full h-full rounded-xl border-none shadow-inner bg-white"
                    title="Document Proof Preview"
                  />
                </>
              ) : (
                <div className="text-center max-w-xs p-6 select-none">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
                    {type === "request" ? (
                      <CalendarClock className="w-8 h-8" />
                    ) : (
                      <FileText className="w-8 h-8" />
                    )}
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg mb-2">No Document Proof</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    This {type === "request" ? "meeting request" : "log"} does not contain any attached document proof.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Submission Details Sidebar */}
            <div className="w-full md:w-96 flex flex-col justify-between p-6 bg-white shrink-0">
              
              {/* Top part: details */}
              <div className="space-y-6 overflow-y-auto pr-1">
                {/* Header Profile */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-xs font-black text-white shadow-sm">
                    {getInitials(studentName)}
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{studentName}</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      {type === "request" ? "Meeting Request" : type === "academic" ? "Academic record" : type === "achievement" ? "Achievement Proof" : "Meeting Log"}
                    </p>
                  </div>
                </div>

                {/* Submission Title */}
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {type === "academic" ? (
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                    ) : type === "achievement" ? (
                      <Award className="h-3.5 w-3.5 text-purple-500" />
                    ) : (
                      <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    Title / Topic
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800 leading-snug">{title}</h3>
                </div>

                {/* Score stats or date timings */}
                {type === "academic" && extraDetails && (
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Marksheet Scores</span>
                    <div className="flex flex-wrap gap-3 font-bold text-xs text-slate-700">
                      <p>CPI: <span className="text-blue-600 font-extrabold">{extraDetails.cpi ?? "N/A"}</span></p>
                      <p>SPI: <span className="text-blue-600 font-extrabold">{extraDetails.spi ?? "N/A"}</span></p>
                      {extraDetails.semester && <p>Semester: <span className="text-slate-800 font-extrabold">{extraDetails.semester}</span></p>}
                    </div>
                  </div>
                )}

                {type === "request" && extraDetails && (
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Proposed Timings</span>
                    <div className="font-bold text-xs text-slate-700 space-y-1">
                      <p>Proposed Date: <span className="text-amber-700 font-extrabold">{extraDetails.proposedDate ? new Date(extraDetails.proposedDate).toLocaleDateString() : "N/A"}</span></p>
                      {extraDetails.proposedTime && <p>Proposed Time: <span className="text-slate-850 font-extrabold">{extraDetails.proposedTime}</span></p>}
                    </div>
                  </div>
                )}

                {/* Description details */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    {type === "request" ? "Proposed Agenda" : "Details & Description"}
                  </span>
                  <p className="text-xs font-semibold leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-48 overflow-y-auto whitespace-pre-line">
                    {description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Bottom part: interactive actions */}
              <div className="border-t border-slate-100 pt-4 mt-4 space-y-3 shrink-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAction("Accept")}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isPending && actionType === "Accept" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {type === "request" ? "Confirm Slot" : "Approve Proof"}
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAction("Reject")}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 py-3 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100/50 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isPending && actionType === "Reject" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    Reject
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
