export interface UserProfile {
  $id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
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
  year: number;
  semester: number;
  gpa: number;
  subjects: string[];
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
  status?: "Requested" | "Confirmed" | "Scheduled" | "Pending" | "Verified" | "Rejected";
}
