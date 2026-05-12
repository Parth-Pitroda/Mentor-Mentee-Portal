"use client";

import { useState, useTransition } from "react";
import { deleteUserProfile } from "@/lib/actions/student.actions";

export default function DeleteUserButton({ profileId, role }: { profileId: string, role: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Protect the admin account from being deleted
  if (role === 'admin') {
    return (
      <button disabled className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg opacity-50 cursor-not-allowed">
        Protected
      </button>
    );
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUserProfile(profileId);
      setIsOpen(false); // Close the modal after deletion
    });
  };

  return (
    <>
      {/* The Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white transition-colors"
      >
        Delete User
      </button>

      {/* The Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="text-xl">⚠️</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Deletion</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you absolutely sure? This action cannot be undone and will permanently remove the user and their data from the system.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsOpen(false)} 
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}