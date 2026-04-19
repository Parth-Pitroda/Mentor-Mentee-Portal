import * as z from "zod";

export const StudentOnboardingSchema = z.object({
  // Step 1: Personal Information
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  rollNumber: z.string().min(4, "Valid Roll Number required"),
  phone: z.string().min(10, "Valid phone number required"),
  department: z.string().min(2, "Department is required"),
  
  // Step 2: Parental Information
  fatherName: z.string().min(3, "Father's name is required"),
  fatherPhone: z.string().min(10, "Valid phone number required"),
  fatherOccupation: z.string().min(2, "Occupation is required"),
  motherName: z.string().min(3, "Mother's name is required"),
  motherPhone: z.string().min(10, "Valid phone number required"),
  motherOccupation: z.string().min(2, "Occupation is required"),
  
  // Step 3: Academic Baseline
  currentYear: z.string().min(1, "Please select current year"),
  
  // UPDATED: Coerce to number and enforce 0-10 scale
  currentGpa: z.coerce
    .number()
    .min(0, "GPA cannot be negative")
    .max(10, "GPA cannot exceed 10"), 
});

export type StudentFormValues = z.infer<typeof StudentOnboardingSchema>;