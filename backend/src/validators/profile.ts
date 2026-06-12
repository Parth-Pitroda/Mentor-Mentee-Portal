import * as z from "zod";

export const ProfileSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  department: z.string().min(2, "Please select your department"),
  role: z.enum(["mentor", "mentee"]),
  bio: z.string().max(500, "Bio is too long"),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
});
