export type AppData = ReturnType<typeof JSON.parse>;

export type ActionResult = {
  success?: boolean;
  error?: string;
  count?: number;
};

export interface UserProfile {
  $id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  name?: string;
  isVerified?: boolean;
  mentorId?: string;
  rollNo?: string;
  semester?: string | number;
  cgpa?: string | number;
  backlogs?: string | number;
  interests?: string;
  profilePictureId?: string;
  bloodGroup?: string;
  residentialStatus?: string;
  phone?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  skills?: string[];
}

export interface MenteeProfile extends UserProfile {
  rollNumber: string;
  parentalInfo: {
    fatherName: string;
    fatherPhone: string;
    fatherOccupation: string;
    motherName: string;
    motherPhone: string;
    motherOccupation: string;
  };
}

export interface AcademicRecord {
  $id?: string;
  year: number;
  semester: number;
  gpa?: number;
  spi?: string | number;
  cpi?: string | number;
  status?: string;
  studentId?: string;
  studentName?: string;
  fileId?: string;
  subjects: string[];
}

export interface AcademicUploadRecord {
  $id: string;
  semester: string | number;
  spi?: string | number;
  cpi?: string | number;
  status?: string;
  studentId?: string;
  studentName?: string;
  fileId?: string;
}

export interface AchievementRecord {
  $id: string;
  title: string;
  category: string;
  description?: string;
  status?: string;
  studentId?: string;
  studentName?: string;
  fileId?: string;
}

export interface NoticeRecord {
  $id: string;
  title: string;
  content: string;
  $createdAt?: string;
}

export interface DepartmentDatum {
  name: string;
  Total: number;
  Verified: number;
}

export interface Meeting {
  $id?: string;
  date: string;
  topic?: string;
  mode?: 'ONLINE' | 'OFFLINE';
  meetingMode?: 'ONLINE' | 'OFFLINE';
  meetingLink?: string;
  mentorId?: string;
  menteeId?: string;
  studentId?: string;
  scheduledTime?: string;
  agenda?: string;
  discussionNotes?: string;
  description?: string;
  mentorName?: string;
  studentName?: string;
  proposedTime?: string;
  status?: "Requested" | "Confirmed" | "Scheduled" | "Pending" | "Verified" | "Rejected";
}
