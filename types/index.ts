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
  date: string;
  mode: 'ONLINE' | 'OFFLINE';
  mentorId: string;
  menteeId: string;
  discussionNotes: string;
}