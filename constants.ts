
import { UserRole, User, Athlete, Team } from './types';

export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    username: 'Clari', 
    name: 'Clarissa Verdugo', 
    role: UserRole.ADMIN, 
    password: '1215', 
    permissions: {
      payments: 'edit',
      physio: 'edit',
      social: 'edit',
      teams: 'edit'
    }
  },
  { 
    id: '2', 
    username: 'fisio1', 
    name: 'Laura Fisio', 
    role: UserRole.FISIO, 
    password: 'password', 
    permissions: {
      payments: 'none',
      physio: 'edit',
      social: 'view',
      teams: 'none'
    }
  },
  { 
    id: '3', 
    username: 'social1', 
    name: 'Juan Social', 
    role: UserRole.SOCIAL, 
    password: 'password', 
    permissions: {
      payments: 'none',
      physio: 'none',
      social: 'edit',
      teams: 'view'
    }
  },
  { 
    id: '4', 
    username: 'coach1', 
    name: 'Carlos Coach', 
    role: UserRole.COACH, 
    password: 'password', 
    permissions: {
      payments: 'none',
      physio: 'view',
      social: 'none',
      teams: 'edit'
    }
  },
];

export const MOCK_ATHLETES: Athlete[] = [
  {
    id: 'a1',
    firstName: 'Mateo',
    lastName: 'García',
    dob: '2012-05-15',
    category: 'Sub-12',
    photo: 'https://picsum.photos/seed/mateo/200/200',
    position: 'Delantero',
    isScholarship: false,
    monthlyDebt: 0,
    physioDebt: 0,
    // Fix: Add missing monthlyTherapyDebt property required by Athlete interface
    monthlyTherapyDebt: 0,
    files: [],
    socialReports: [],
    physioConsultations: [],
    injuryHistory: ['Esguince de tobillo (2023)'],
    physicalTests: [],
    coachName: 'Carlos Coach',
    payments: {},
    tutorName: 'Roberto García',
    tutorPhone: '614-123-4567'
  }
];

export const MOCK_TEAMS: Team[] = [
  { id: 't1', category: 'Varonil', ageCategory: 'Sub-12', athleteIds: ['a1'] }
];
