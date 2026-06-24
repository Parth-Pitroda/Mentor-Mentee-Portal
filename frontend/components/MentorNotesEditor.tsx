"use client";

import { useState, useEffect } from "react";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import { saveMentorNote } from "@/lib/actions/student.actions";

type MentorNotesEditorProps = {
  studentId: string;
  initialContent: string;
  initialCollectionMissing?: boolean;
};

export default function MentorNotesEditor({
  studentId,
  initialContent,
  initialCollectionMissing = false,
}: MentorNotesEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [collectionMissing, setCollectionMissing] = useState(initialCollectionMissing);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if initialContent changes
  useEffect(() => {
    setContent(initialContent);
    setIsSaved(true);
  }, [initialContent]);

  // Debounced auto-save after typing stops
  useEffect(() => {
    if (isSaved || content === initialContent) return;

    const timer = setTimeout(() => {
      handleSave(content);
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, isSaved, initialContent]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
    setErrorMessage(null);
  };

  const handleSave = async (textToSave: string) => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await saveMentorNote(studentId, textToSave);
      if (res.success) {
        setIsSaved(true);
      } else {
        const errMsg = res.error || "Failed to save note.";
        setErrorMessage(errMsg);
        if (errMsg.toLowerCase().includes("collection") || errMsg.toLowerCase().includes("missing")) {
          setCollectionMissing(true);
        }
      }
    } catch (err: any) {
      console.error("Auto-save failed:", err);
      setErrorMessage(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = () => {
    if (!isSaved) {
      handleSave(content);
    }
  };

  return (
    <div className="space-y-3.5 select-none animate-in fade-in duration-300">
      {/* Title Header matching the style of other dossier sections */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-750 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Mentor Notes (Private)</span>
        </h3>
        
        {/* Subtle Status Indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
          {isSaving ? (
            <span className="text-blue-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              Saving...
            </span>
          ) : isSaved ? (
            <span className="text-slate-400">Saved</span>
          ) : (
            <span className="text-amber-500 animate-pulse">Unsaved changes</span>
          )}
        </div>
      </div>

      {/* Warning if Appwrite Collection is Missing */}
      {collectionMissing && (
        <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-[11px] text-amber-800 font-medium leading-relaxed">
          <div className="flex gap-1.5 items-start mb-1 font-bold text-xs uppercase tracking-wider text-amber-900">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-650" />
            <span>Appwrite Setup Required</span>
          </div>
          <p className="opacity-95">The <code>mentor_notes</code> collection is missing in the database.</p>
          <p className="mt-1 opacity-90 text-[10px]">
            Please create a collection with ID <code>mentor_notes</code> containing string attributes:
            <code className="bg-amber-100/50 px-1 py-0.5 rounded mx-0.5 font-mono">studentId</code>,
            <code className="bg-amber-100/50 px-1 py-0.5 rounded mx-0.5 font-mono">mentorId</code>, and
            <code className="bg-amber-100/50 px-1 py-0.5 rounded mx-0.5 font-mono">content</code> (large/long text).
          </p>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && !collectionMissing && (
        <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-[11px] text-rose-800 font-medium leading-relaxed">
          <div className="flex gap-1.5 items-center mb-0.5 font-bold text-xs uppercase tracking-wider text-rose-900">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>Error Saving Note</span>
          </div>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Note Textarea - borderless look that sits natively as a writing pad */}
      <div className="relative">
        <textarea
          value={content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          placeholder="Add a private note about this mentee (only visible to you)..."
          className="w-full min-h-[140px] rounded-2xl bg-slate-50 p-4 font-poppins text-xs font-semibold text-slate-900 border border-slate-200/60 focus:border-slate-350 focus:bg-white focus:outline-none focus:ring-0 transition-all placeholder:text-slate-400 leading-relaxed shadow-sm disabled:text-slate-450"
        />
      </div>
    </div>
  );
}
