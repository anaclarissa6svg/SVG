
import { UserRole, User, Athlete, Team } from './types';

const currentYear = new Date().getFullYear();

export const MOCK_USERS: User[] = [
  { id: '1', username: 'Clari', name: 'Clarissa Verdugo', role: UserRole.ADMIN },
  { id: '2', username: 'fisio1', name: 'Laura Fisio', role: UserRole.FISIO },
  { id: '3', username: 'social1', name: 'Juan Social', role: UserRole.SOCIAL },
  { id: '4', username: 'coach1', name: 'Carlos Coach', role: UserRole.COACH },
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
    files: [],
    socialReports: [],
    physioConsultations: [
      {
        id: 'c1',
        date: '10/05/2024',
        reason: 'Dolor lumbar',
        diagnosis: 'Contractura muscular',
        observations: 'Paciente refiere dolor tras entrenamiento intenso',
        treatment: 'Masaje de descarga y calor local',
        createdBy: 'Laura Fisio'
      }
    ],
    injuryHistory: ['Esguince de tobillo (2023)'],
    physicalTests: [],
    coachName: 'Carlos Coach',
    payments: {
      [`${currentYear}-Enero`]: 500,
      [`${currentYear}-Febrero`]: 500,
      [`${currentYear}-Marzo`]: 500,
      [`${currentYear}-Abril`]: 500
    },
    tutorName: 'Roberto García',
    tutorPhone: '614-123-4567'
  },
  {
    id: 'a2',
    firstName: 'Santiago',
    lastName: 'Rodríguez',
    dob: '2010-02-20',
    category: 'Sub-14',
    photo: 'https://picsum.photos/seed/santiago/200/200',
    position: 'Portero',
    isScholarship: true,
    monthlyDebt: 0,
    physioDebt: 150,
    files: [],
    socialReports: [],
    physioConsultations: [],
    injuryHistory: [],
    physicalTests: [],
    coachName: 'Carlos Coach',
    payments: {
      [`${currentYear}-Enero`]: 150,
      [`${currentYear}-Febrero`]: 150
    },
    tutorName: 'Elena Rodríguez',
    tutorPhone: '614-987-6543'
  },
  {
    id: 'a3',
    firstName: 'Valentina',
    lastName: 'López',
    dob: '2011-11-11',
    category: 'Sub-13 Femenil',
    photo: 'https://picsum.photos/seed/valentina/200/200',
    position: 'Mediocampista',
    isScholarship: false,
    monthlyDebt: 500,
    physioDebt: 0,
    files: [],
    socialReports: [],
    physioConsultations: [],
    injuryHistory: [],
    physicalTests: [],
    coachName: 'Marisol Coach',
    payments: {
      [`${currentYear}-Enero`]: 500,
      [`${currentYear}-Marzo`]: 500
    },
    tutorName: 'Claudia López',
    tutorPhone: '614-555-0199'
  }
];

export const MOCK_TEAMS: Team[] = [
  { id: 't1', category: 'Varonil', ageCategory: 'Sub-12', athleteIds: ['a1'] },
  { id: 't2', category: 'Varonil', ageCategory: 'Sub-14', athleteIds: ['a2'] }
];
