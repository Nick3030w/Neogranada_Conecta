export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  studentCode: string;
  academicProgram: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  notificationsMuted?: boolean;
  darkMode?: boolean;
  fcmToken?: string;
}
