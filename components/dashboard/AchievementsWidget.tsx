"use client";

import { useState } from "react";
import { addAchievement } from "@/lib/actions/student.actions";

export default function AchievementsWidget({ 
  studentId, 
  initialData 
}: { 
  studentId: string, 
  initialData: any[] 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: "", category: "Hackathon" });
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    await addAchievement(studentId, formData.title, formData.category);
    
    setFormData({ title: "", category: "Hackathon" });
    setIsAdding(false);
    setIsLoading(false);
  }

  // Helper to pick an emoji based on category
  const getIcon = (cat: string) => {
    if (cat === "Hackathon") return "💻";
    if (cat === "Internship") return "🏢";
    if (cat === "GATE") return "📚";
    return "🏆";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800">Achievements</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
        >
          {isAdding ? "Cancel" : "+ Add New"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
          <input 
            type="text" 
            placeholder="E.g., Finalist at SIH 2026" 
            required
            className="w-full text-sm p-2 border border-gray-300 rounded outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
          <div className="flex gap-2">
            <select 
              className="w-1/2 text-sm p-2 border border-gray-300 rounded outline-none"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="Hackathon">Hackathon</option>
              <option value="Internship">Internship</option>
              <option value="GATE">GATE Prep</option>
              <option value="Certification">Certification</option>
            </select>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-1/2 bg-purple-600 text-white text-sm font-bold rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {initialData.length === 0 && !isAdding ? (
          <div className="h-full flex flex-col justify-center items-center text-center opacity-70 pt-4">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-xs text-gray-500">No achievements logged yet.<br/>Time to start building!</p>
          </div>
        ) : (
          initialData.map((item) => (
            <div key={item.$id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-xl bg-white w-8 h-8 flex items-center justify-center rounded-full shadow-sm border border-gray-200">
                {getIcon(item.category)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 leading-tight">{item.title}</p>
                <p className="text-xs text-purple-600 font-semibold mt-0.5">{item.category}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}