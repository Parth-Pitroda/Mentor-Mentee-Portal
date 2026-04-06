"use server";

import { databases } from "@/lib/appwrite/config";
import { ID, Query } from "appwrite";
import { StudentFormValues } from "../validation/student";
import { getLoggedInUser } from "./auth.actions";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const PROFILES_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_ID!;
const ACADEMICS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ACADEMICS_ID!;

export async function createStudentProfile(studentData: StudentFormValues) {
  try {
    const user = await getLoggedInUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Create the Main Profile Document
    const newProfile = await databases.createDocument(
      DATABASE_ID,
      PROFILES_COLLECTION,
      ID.unique(),
      {
        fullName: studentData.fullName,
        email: user.email, // Automatically use the logged-in user's email
        role: "mentee",
        department: studentData.department,
        bio: `Roll No: ${studentData.rollNumber} | Phone: ${studentData.phone}`,
        isVerified: false,
        skills: [],
      }
    );

    // 2. Create the linked Academic Record Document
    await databases.createDocument(
      DATABASE_ID,
      ACADEMICS_COLLECTION,
      ID.unique(),
      {
        studentId: newProfile.$id,
        year: parseInt(studentData.currentYear),
        gpa: parseFloat(studentData.currentGpa),
        subjects: [],
      }
    );

    return JSON.parse(JSON.stringify({ success: true, profileId: newProfile.$id }));
  } catch (error: any) {
    console.error("Appwrite Database Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getStudentProfile(profileId: string) {
  try {
    const profile = await databases.getDocument(
      DATABASE_ID,
      PROFILES_COLLECTION,
      profileId
    );
    
    const academics = await databases.listDocuments(
      DATABASE_ID,
      ACADEMICS_COLLECTION,
      [Query.equal("studentId", profileId)]
    );

    return JSON.parse(JSON.stringify({ 
      profile, 
      academics: academics.documents[0] || null 
    }));
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }
}