"use client";

import { useState } from "react";
import { respondToMeetingRequest } from "@/lib/actions/student.actions";
import { useRouter } from "@/lib/router-compat";

export default function MeetingActionButtons({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await respondToMeetingRequest(meetingId, "Confirmed");
    setIsSubmitting(false);
    router.refresh();
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectMessage.trim()) return;
    
    setIsSubmitting(true);
    await respondToMeetingRequest(meetingId, "Rejected", rejectMessage);
    setIsSubmitting(false);
    setShowRejectModal(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-2 min-w-max">
        <button 
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm transition-all disabled:opacity-50"
        >
          {isSubmitting ? "..." : "Confirm"}
        </button>
        <button 
          onClick={() => setShowRejectModal(true)}
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
        >
          Reject
        </button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Reject Meeting Request</h2>
            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Reason / Next Steps
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="E.g., I have another class at this time. Please request a meeting for Friday afternoon."
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !rejectMessage.trim()}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 font-bold text-white transition-colors hover:bg-red-700 disabled:bg-slate-400"
                >
                  {isSubmitting ? "Rejecting..." : "Send Rejection"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
