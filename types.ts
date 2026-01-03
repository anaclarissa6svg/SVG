
export enum UserRole {
  ADMIN = 'ADMIN',
  FISIO = 'FISIO',
  SOCIAL = 'SOCIAL',
  COACH = 'COACH'
}

export type PermissionLevel = 'none' | 'view' | 'edit';

export interface UserPermissions {
  payments: PermissionLevel;
  physio: PermissionLevel;
  social: PermissionLevel;
  teams: PermissionLevel;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  permissions: UserPermissions;
}

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  category: string;
  photo: string;
  position: string;
  isScholarship: boolean;
  monthlyDebt: number;
  physioDebt: number;
  monthlyTherapyDebt: number;
  previousYearDebt: number;
  files: AthleteFile[];
  socialReports: SocialReport[];
  physioConsultations: PhysioConsultation[];
  injuryHistory: string[];
  physicalTests: PhysicalTest[];
  coachName?: string;
  payments?: { [month: string]: number };
  therapyPayments?: { [month: string]: number };
  inscriptionPaid?: { [year: string]: boolean }; // Nuevo campo para inscripciones
  tutorName?: string;
  tutorPhone?: string;
  
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  medications?: string;
  surgicalHistory?: string;
  familyHistory?: string;
  clinicalNotes?: string;

  familyComposition?: string;
  housingStatus?: string;
  economicStatus?: string;
  schoolName?: string;
  schoolGrade?: string;
  academicAverage?: string;
  socialBehavioralNotes?: string;
}

export interface AthleteFile {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
  uploadedBy: string;
}

export interface SocialReport {
  id: string;
  date: string;
  title: string;
  content: string;
  createdBy: string;
}

export interface PhysioConsultation {
  id: string;
  date: string;
  reason: string;
  observations: string;
  diagnosis: string;
  treatment: string;
  createdBy: string;
}

export interface PhysicalTest {
  id: string;
  date: string;
  weight: string;
  height: string;
  speed: string;
  endurance: string;
  power: string;
  observations: string;
  createdBy: string;
}

export interface Team {
  id: string;
  category: string;
  ageCategory?: string;
  athleteIds: string[];
  coachName?: string;
}

export interface Match {
  id: string;
  teamId: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  locationUri?: string;
  observations: string;
  selectedAthleteIds: string[];
}

export interface NoticeEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  createdBy: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  targetId: string;
  targetType: string;
}
