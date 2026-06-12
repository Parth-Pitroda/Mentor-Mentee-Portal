import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  department: z.string().min(2, { message: "Please select a valid department." }),
  skills: z.string().max(200, { message: "Skills list is too long. Keep it under 200 characters." })
});
