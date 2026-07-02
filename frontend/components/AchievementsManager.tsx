"use client";

import { useState } from "react";
import { uploadAchievement, updateAchievementStatus } from "@/lib/actions/student.actions";
import StyledFileInput from "@/components/StyledFileInput";
import { useRouter } from "@/lib/router-compat";
import { getFileViewUrl } from "@/lib/files";
import type { AchievementRecord } from "@/types";

function parseAchievementCategory(record: AchievementRecord) {
  const desc = record.description || "";
  if (desc.startsWith("[Category: ")) {
    const match = desc.match(/^\[Category: ([^\]]+)\]/);
    if (match) {
      const cat = match[1];
      if (desc.includes("[Explanation: ")) {
        const expMatch = desc.match(/\[Explanation: ([^\]]+)\]/);
        if (expMatch) return `${cat} (${expMatch[1]})`;
      }
      return cat;
    }
  }
  return record.category;
}

function parseAchievementDescription(record: AchievementRecord) {
  const desc = record.description || "";
  return desc
    .replace(/^\[Category: [^\]]+\]\n?/, "")
    .replace(/^\[Explanation: [^\]]+\]\n?/, "")
    .trim();
}

type AchievementsManagerProps = {
  initialRecords: AchievementRecord[];
  profileId: string;
  isMentor: boolean;
};

export default function AchievementsManager({ initialRecords, profileId, isMentor }: AchievementsManagerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const selectedCat = formData.get("category") as string;
    const originalDesc = formData.get("description") as string;

    // Database supported Enum values are strictly ["Hackathon", "Internship", "Competitive Exam"]
    const dbSupported = ["Hackathon", "Internship", "Competitive Exam"];

    if (!dbSupported.includes(selectedCat)) {
      // Map it to a valid enum option so Appwrite accepts it
      formData.set("category", "Competitive Exam");
      
      if (selectedCat === "Other") {
        const explanation = formData.get("explanation") as string;
        formData.set("description", `[Category: Other]\n[Explanation: ${explanation}]\n\n${originalDesc}`);
      } else {
        formData.set("description", `[Category: ${selectedCat}]\n\n${originalDesc}`);
      }
    } else {
      formData.set("description", originalDesc);
    }

    const result = await uploadAchievement(formData, profileId);

    if (result.success) {
      setCategory(""); // Reset category dropdown
      router.refresh();
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const handleVerification = async (recordId: string, status: "Verified" | "Rejected") => {
    setIsLoading(true);
    await updateAchievementStatus(recordId, status, profileId);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* 1. MENTEE UPLOAD FORM */}
      {!isMentor && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-800">Add New Achievement</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                <input required name="title" type="text" className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Smart India Hackathon Winner" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                <select 
                  required 
                  name="category" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category...</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Internship">Internship</option>
                  <option value="Competitive Exam">Competitive Exam (GATE, CAT, etc.)</option>
                  <option value="Certification">Certification</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {category === "Other" && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Specify Category Explanation <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  name="explanation" 
                  type="text" 
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g. Research Paper Publication, Community Service" 
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Details</label>
              <textarea required name="description" rows={3} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Briefly describe your achievement..." />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proof Document (Optional Image/PDF)</label>
              <StyledFileInput name="file" accept="image/*,.pdf" label="Choose proof" />
            </div>

            <button disabled={isLoading} type="submit" className="rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? "Saving..." : "Submit Achievement"}
            </button>
          </form>
        </div>
      )}

      {/* 2. ACHIEVEMENTS TABLE */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">Verified Achievements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Title & Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Proof</th>
                <th className="px-6 py-4">Status</th>
                {isMentor && <th className="px-6 py-4 text-right">Mentor Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialRecords.length > 0 ? (
                initialRecords.map((record) => (
                  <tr key={record.$id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700">{record.title}</p>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{parseAchievementCategory(record)}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={parseAchievementDescription(record)}>
                      {parseAchievementDescription(record)}
                    </td>
                    <td className="px-6 py-4">
                      {record.fileId ? (
                        <a href={getFileViewUrl(record.fileId)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                          📄 View Proof
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-xs">No file</span>
                      )}
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
                  <td colSpan={isMentor ? 5 : 4} className="px-6 py-10 text-center text-slate-400">No achievements recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
