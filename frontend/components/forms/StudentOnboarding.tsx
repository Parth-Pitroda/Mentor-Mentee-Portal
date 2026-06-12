"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StudentOnboardingSchema, StudentFormInput, StudentFormValues } from "@/lib/validation/student";
import { createStudentProfile } from "@/lib/actions/student.actions";

export default function StudentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<StudentFormInput, unknown, StudentFormValues>({
    resolver: zodResolver(StudentOnboardingSchema),
    mode: "onChange",
  });

  // Handle moving to the next step with validation
  const nextStep = async () => {
    let fieldsToValidate: (keyof StudentFormInput)[] = [];
    if (step === 1) fieldsToValidate = ["fullName", "rollNumber", "phone", "department"];
    if (step === 2) fieldsToValidate = ["fatherName", "fatherPhone", "fatherOccupation", "motherName", "motherPhone", "motherOccupation"];
    
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  // Handle the final submission to Appwrite
  const onSubmit = async (values: StudentFormValues) => {
  setIsSubmittingForm(true);
  const result = await createStudentProfile(values);

  if (result.success) {
    router.push(`/dashboard/${result.profileId}`);
  } else {
    alert("Error: " + result.error);
    setIsSubmittingForm(false);
  }
};
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Mentee Onboarding</h2>
        <p className="text-sm text-gray-500">
          Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Parental Details' : 'Academics'}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* STEP 1: Basic Info */}
        <div className={step === 1 ? "block space-y-4" : "hidden"}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input {...register("fullName")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="John Doe" />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Roll Number</label>
              <input {...register("rollNumber")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 2024CS01" />
              {errors.rollNumber && <p className="text-red-500 text-xs mt-1">{errors.rollNumber.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select {...register("department")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Dept...</option>
                <option value="CS">Computer Science</option>
                <option value="IT">Information Tech</option>
                <option value="ME">Mechanical</option>
                <option value="EC">Electronics</option>
                <option value="CE">Civil</option>
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Student Phone</label>
            <input {...register("phone")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="+91 9876543210" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        {/* STEP 2: Parental Info */}
        <div className={step === 2 ? "block space-y-6" : "hidden"}>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3">Father&apos;s Details</h3>
            <div className="space-y-3">
              <input {...register("fatherName")} className="block w-full rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="Father's Name" />
              {errors.fatherName && <p className="text-red-500 text-xs">{errors.fatherName.message}</p>}
              
              <div className="grid grid-cols-2 gap-3">
                <input {...register("fatherPhone")} className="block w-full rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="Phone Number" />
                <input {...register("fatherOccupation")} className="block w-full rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="Occupation" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {errors.fatherPhone && <p className="text-red-500 text-xs">{errors.fatherPhone.message}</p>}
                {errors.fatherOccupation && <p className="text-red-500 text-xs">{errors.fatherOccupation.message}</p>}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3">Mother&apos;s Details</h3>
            <div className="space-y-3">
              <input {...register("motherName")} className="block w-full rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="Mother's Name" />
              {errors.motherName && <p className="text-red-500 text-xs">{errors.motherName.message}</p>}
              
              <div className="grid grid-cols-2 gap-3">
                <input {...register("motherPhone")} className="block w-full rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="Phone Number" />
                <input {...register("motherOccupation")} className="block w-full rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="Occupation" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {errors.motherPhone && <p className="text-red-500 text-xs">{errors.motherPhone.message}</p>}
                {errors.motherOccupation && <p className="text-red-500 text-xs">{errors.motherOccupation.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: Academics */}
        <div className={step === 3 ? "block space-y-4" : "hidden"}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Year</label>
            <select {...register("currentYear")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select Year...</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
            {errors.currentYear && <p className="text-red-500 text-xs mt-1">{errors.currentYear.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Current GPA / CGPA</label>
            <input type="number" step="0.01" {...register("currentGpa")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 8.5" />
            {errors.currentGpa && <p className="text-red-500 text-xs mt-1">{errors.currentGpa.message}</p>}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-100">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button type="button" onClick={nextStep} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors">
              Next Step
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={isSubmittingForm} 
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {isSubmittingForm ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Complete Profile"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
