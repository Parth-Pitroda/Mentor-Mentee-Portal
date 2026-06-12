"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeMenteeOnboarding } from "@/lib/actions/student.actions";

export default function OnboardingWizard({ userId, userName, userEmail }: { userId: string, userName?: string, userEmail?: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State to hold all fields, including the file object
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: userName || "", phone: "", email: userEmail || "", bloodGroup: "", residentialStatus: "", profilePicture: null as File | null,
    // Step 2: Academic
    rollNo: "", department: "", semester: "", cgpa: "", backlogs: "0", interests: "",
    // Step 3: Family
    fatherName: "", fatherOccupation: "", fatherPhone: "", fatherEmail: "",
    motherName: "", motherOccupation: "", motherPhone: "", motherEmail: ""
  });

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, profilePicture: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "profilePicture" && value) {
         // Pack the file specifically
        data.append("profilePicture", value as File);
      } else if (value && key !== "profilePicture") {
         // Pack all strings
        data.append(key, value as string);
      }
    });

    const result = await completeMenteeOnboarding(userId, data);

    if (result.success) {
      router.push(`/dashboard/${userId}`); 
      router.refresh();
    } else {
      alert("Error saving profile: " + result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      
      {/* --- PROGRESS BAR HEADER --- */}
      <div className="border-b border-slate-100 bg-slate-50 p-6">
        <div className="flex items-center justify-between mb-2">
          {['Personal Details', 'Academic Profile', 'Family Info'].map((stepName, index) => (
            <div key={stepName} className={`flex flex-col items-center w-1/3 ${currentStep >= index + 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-colors ${currentStep >= index + 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {index + 1}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">{stepName}</span>
            </div>
          ))}
        </div>
        <div className="relative w-full h-1 bg-slate-200 rounded-full mt-4">
          <div 
            className="absolute top-0 left-0 h-1 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '100%' }}
          ></div>
        </div>
      </div>

      {/* --- FORM CONTENT --- */}
      <form onSubmit={handleSubmit} className="p-8">
        
        {/* STEP 1: PERSONAL DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">Student Identity</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Profile Picture</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full cursor-pointer rounded-lg border border-slate-200 text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select...</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Housing</label>
                  <select name="residentialStatus" value={formData.residentialStatus} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select...</option>
                    <option value="Hosteller">Hosteller</option>
                    <option value="Day Scholar">Day Scholar</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ACADEMIC PROFILE */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">University Records</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Roll Number</label>
                <input type="text" name="rollNo" value={formData.rollNo} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                <select name="department" value={formData.department} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Department...</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="ICT">ICT</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4 md:col-span-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500">
                     <option value="">Select...</option>
                     {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Sem {sem}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Current CGPA</label>
                  <input type="number" step="0.01" name="cgpa" value={formData.cgpa} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 8.5"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Active Backlogs</label>
                  <input type="number" name="backlogs" value={formData.backlogs} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500" min="0"/>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Key Technical Interests / Skills</label>
                <input type="text" name="interests" value={formData.interests} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Full-Stack Dev, AutoCAD, Machine Learning..."/>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: FAMILY INFORMATION */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">Parental / Guardian Contact</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider bg-slate-100 p-2 rounded-lg text-center">Father&apos;s Details</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
                  <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Occupation</label>
                  <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} required className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input type="email" name="fatherEmail" value={formData.fatherEmail} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider bg-slate-100 p-2 rounded-lg text-center">Mother&apos;s Details</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
                  <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Occupation</label>
                  <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input type="tel" name="motherPhone" value={formData.motherPhone} onChange={handleChange} required className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input type="email" name="motherEmail" value={formData.motherEmail} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- NAVIGATION FOOTER --- */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button 
            type="button" 
            onClick={handlePrev} 
            disabled={currentStep === 1}
            className={`rounded-lg px-6 py-2.5 font-bold transition-colors ${currentStep === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}
          >
            Go Back
          </button>
          
          {currentStep < 3 ? (
            <button 
              type="button" 
              onClick={handleNext}
              className="rounded-lg bg-blue-600 px-8 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Continue to Step {currentStep + 1}
            </button>
          ) : (
            <button 
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-green-600 px-8 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-green-700 disabled:bg-green-400"
            >
              {isSubmitting ? "Saving Profile..." : "Submit Profile"}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
