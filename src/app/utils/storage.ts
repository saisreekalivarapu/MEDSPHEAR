import { Patient, Doctor, ReplacementEvent, EmergencyEvent } from '../types';

const STORAGE_KEY_PATIENTS = 'hospital_patients';
const STORAGE_KEY_DOCTORS = 'hospital_doctors';
const STORAGE_KEY_CURRENT_PATIENT = 'current_patient_session';
const STORAGE_KEY_REPLACEMENT_LOG = 'medsphere_replacement_log';
const STORAGE_KEY_EMERGENCY_EVENTS = 'medsphere_emergency_events';

export function setCurrentPatient(patient: Patient | null): void {
  if (patient) {
    localStorage.setItem(STORAGE_KEY_CURRENT_PATIENT, JSON.stringify(patient));
  } else {
    localStorage.removeItem(STORAGE_KEY_CURRENT_PATIENT);
  }
}

export function getCurrentPatient(): Patient | null {
  const stored = localStorage.getItem(STORAGE_KEY_CURRENT_PATIENT);
  return stored ? JSON.parse(stored) : null;
}

// Initialize with some mock doctors (with extended profile data for replacement scoring)
export function initializeDoctors(): Doctor[] {
  const stored = localStorage.getItem(STORAGE_KEY_DOCTORS);
  if (stored) {
    return JSON.parse(stored);
  }

  const doctors: Doctor[] = [
    // General Physician
    { id: 'gp1', name: 'Dr. J M Dua', specialization: 'General Physician', status: 'available', averageConsultationTime: 15, patientsToday: 0, experience: 22, rating: 4.7, qualifications: 'MBBS, MD (Medicine)' },
    { id: 'gp2', name: 'Dr. Om Prakash Sharma', specialization: 'General Physician', status: 'available', averageConsultationTime: 15, patientsToday: 0, experience: 18, rating: 4.5, qualifications: 'MBBS, MD (Medicine)' },
    { id: 'gp3', name: 'Dr. Prof Ramulu', specialization: 'General Physician', status: 'available', averageConsultationTime: 20, patientsToday: 0, experience: 30, rating: 4.8, qualifications: 'MBBS, MD, PhD (Medicine)' },
    // Gynecologist
    { id: 'gyn1', name: 'Dr. Sabyata Gupta', specialization: 'Gynecologist', status: 'available', averageConsultationTime: 20, patientsToday: 0, experience: 14, rating: 4.6, qualifications: 'MBBS, MS (OBG)' },
    { id: 'gyn2', name: 'Dr. Tuhina Bhat', specialization: 'Gynecologist', status: 'available', averageConsultationTime: 18, patientsToday: 0, experience: 11, rating: 4.4, qualifications: 'MBBS, DGO' },
    { id: 'gyn3', name: 'Dr. Angila Aneja', specialization: 'Gynecologist', status: 'available', averageConsultationTime: 22, patientsToday: 0, experience: 19, rating: 4.7, qualifications: 'MBBS, MS (OBG), FRCOG' },
    { id: 'gyn4', name: 'Dr. Ferosa Barik', specialization: 'Gynecologist', status: 'available', averageConsultationTime: 15, patientsToday: 0, experience: 8, rating: 4.2, qualifications: 'MBBS, DGO' },
    // Dentist
    { id: 'den1', name: 'Dr. Amandeep Singh Dhillon', specialization: 'Dentist', status: 'available', averageConsultationTime: 25, patientsToday: 0, experience: 16, rating: 4.8, qualifications: 'BDS, MDS (Prosthodontics)' },
    { id: 'den2', name: 'Dr. Anil Kohli', specialization: 'Dentist', status: 'available', averageConsultationTime: 20, patientsToday: 0, experience: 28, rating: 4.9, qualifications: 'BDS, MDS, FICD' },
    { id: 'den3', name: 'Dr. Tarun Giroti', specialization: 'Dentist', status: 'available', averageConsultationTime: 15, patientsToday: 0, experience: 9, rating: 4.3, qualifications: 'BDS, MDS (Orthodontics)' },
    // Orthopedic
    { id: 'orth1', name: 'Dr. Ashok Raj Gopal', specialization: 'Orthopedic', status: 'available', averageConsultationTime: 25, patientsToday: 0, experience: 24, rating: 4.9, qualifications: 'MBBS, MS (Ortho), FRCS' },
    { id: 'orth2', name: 'Dr. SKS Arya', specialization: 'Orthopedic', status: 'available', averageConsultationTime: 20, patientsToday: 0, experience: 20, rating: 4.6, qualifications: 'MBBS, MS (Ortho)' },
    { id: 'orth3', name: 'Dr. Ips Oberoy', specialization: 'Orthopedic', status: 'available', averageConsultationTime: 18, patientsToday: 0, experience: 13, rating: 4.4, qualifications: 'MBBS, DNB (Ortho)' },
    // Psychiatrist
    { id: 'psy1', name: 'Dr. Ajit Kumar', specialization: 'Psychiatrist', status: 'available', averageConsultationTime: 30, patientsToday: 0, experience: 21, rating: 4.7, qualifications: 'MBBS, MD (Psychiatry)' },
    { id: 'psy2', name: 'Dr. Samir Parik', specialization: 'Psychiatrist', status: 'available', averageConsultationTime: 25, patientsToday: 0, experience: 17, rating: 4.5, qualifications: 'MBBS, MD (Psychiatry)' },
    { id: 'psy3', name: 'Dr. Murli Raj', specialization: 'Psychiatrist', status: 'available', averageConsultationTime: 20, patientsToday: 0, experience: 12, rating: 4.3, qualifications: 'MBBS, DPM' },
    // Cardiologist
    { id: 'card1', name: 'Dr. Devi Prasad Shetty', specialization: 'Cardiologist', status: 'available', averageConsultationTime: 30, patientsToday: 0, experience: 35, rating: 5.0, qualifications: 'MBBS, FRCS (Cardiothoracic)' },
    { id: 'card2', name: 'Dr. Ashok Seth', specialization: 'Cardiologist', status: 'available', averageConsultationTime: 25, patientsToday: 0, experience: 30, rating: 4.9, qualifications: 'MBBS, MD, DM (Cardiology)' },
    { id: 'card3', name: 'Dr. Naresh Trehan', specialization: 'Cardiologist', status: 'available', averageConsultationTime: 25, patientsToday: 0, experience: 32, rating: 4.9, qualifications: 'MBBS, MS, FRCS' },
    // Pediatrician
    { id: 'ped1', name: 'Dr. YK Amedkar', specialization: 'Pediatrician', status: 'available', averageConsultationTime: 15, patientsToday: 0, experience: 20, rating: 4.6, qualifications: 'MBBS, MD (Pediatrics)' },
    { id: 'ped2', name: 'Dr. SK Kabra', specialization: 'Pediatrician', status: 'available', averageConsultationTime: 25, patientsToday: 0, experience: 25, rating: 4.8, qualifications: 'MBBS, MD, FIAP' },
    { id: 'ped3', name: 'Dr. Arvind Garg', specialization: 'Pediatrician', status: 'available', averageConsultationTime: 20, patientsToday: 0, experience: 18, rating: 4.5, qualifications: 'MBBS, DCH, MD (Pediatrics)' },
    // ENT
    { id: 'ent1', name: 'Dr. KK Handa', specialization: 'ENT', status: 'available', averageConsultationTime: 15, patientsToday: 0, experience: 26, rating: 4.8, qualifications: 'MBBS, MS (ENT)' },
    { id: 'ent2', name: 'Dr. Ameet Kishore', specialization: 'ENT', status: 'available', averageConsultationTime: 18, patientsToday: 0, experience: 19, rating: 4.6, qualifications: 'MBBS, MS (ENT), FRCS' },
    { id: 'ent3', name: 'Dr. Sanjay Sachdeva', specialization: 'ENT', status: 'available', averageConsultationTime: 20, patientsToday: 0, experience: 14, rating: 4.4, qualifications: 'MBBS, DNB (ENT)' },
    // Dermatologist
    { id: 'der1', name: 'Dr. Apratim Goel', specialization: 'Dermatologist', status: 'available', averageConsultationTime: 15, patientsToday: 0, experience: 15, rating: 4.6, qualifications: 'MBBS, MD (Dermatology)' },
    { id: 'der2', name: 'Dr. Jaishree Sharad', specialization: 'Dermatologist', status: 'available', averageConsultationTime: 18, patientsToday: 0, experience: 12, rating: 4.5, qualifications: 'MBBS, DVD' }
  ];

  localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
  return doctors;
}

export function getPatients(): Patient[] {
  const stored = localStorage.getItem(STORAGE_KEY_PATIENTS);
  return stored ? JSON.parse(stored) : [];
}

export function savePatient(patient: Patient): void {
  const patients = getPatients();

  // Auto-mark as follow-up if they meet criteria (5th registration)
  const history = patients.filter(p =>
    p.name.trim().toLowerCase() === patient.name.trim().toLowerCase() &&
    p.phoneNumber.trim() === patient.phoneNumber.trim() &&
    p.age === patient.age
  );

  if (history.length >= 4) { // Current + 4 previous = 5
    patient.isFollowUp = true;
    patient.consultationCount = history.length + 1;

    // Find previously consulted doctor from most recent booking
    const sortedHistory = [...history].sort((a, b) =>
      new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime()
    );

    if (sortedHistory.length > 0) {
      const lastBooking = sortedHistory[0];
      patient.previouslyConsultedDoctorId = lastBooking.assignedDoctor || lastBooking.bookedDoctorId;
      patient.lastSpecialist = lastBooking.lastSpecialist; // or derive from assigned doctor
      patient.lastDepartment = lastBooking.appointmentType;
    }
  }

  const existingIndex = patients.findIndex(p => p.id === patient.id);

  if (existingIndex >= 0) {
    patients[existingIndex] = patient;
  } else {
    patients.push(patient);
  }

  localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(patients));
}

export function updatePatients(patients: Patient[]): void {
  localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(patients));
}

export function getDoctors(): Doctor[] {
  const stored = localStorage.getItem(STORAGE_KEY_DOCTORS);
  return stored ? JSON.parse(stored) : initializeDoctors();
}

export function updateDoctors(doctors: Doctor[]): void {
  localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY_PATIENTS);
  localStorage.removeItem(STORAGE_KEY_DOCTORS);
  localStorage.removeItem(STORAGE_KEY_REPLACEMENT_LOG);
  initializeDoctors();
}

// ─── Follow-Up Logic Helpers ──────────────────────────────────────────────────

export function getPatientHistory(name: string, phoneNumber: string, age: number): Patient[] {
  const patients = getPatients();
  return patients.filter(p =>
    p.name.trim().toLowerCase() === name.trim().toLowerCase() &&
    p.phoneNumber.trim() === phoneNumber.trim() &&
    p.age === age
  );
}

export function checkFollowUpEligibility(name: string, phoneNumber: string, age: number): {
  isEligible: boolean;
  history: Patient[];
  consultationCount: number;
} {
  const history = getPatientHistory(name, phoneNumber, age);
  const consultationCount = history.length;

  // Logic: 5 or more previous registrations with consistent details
  const isEligible = consultationCount >= 4; // 4 previous means current is 5th

  return { isEligible, history, consultationCount };
}

// ─── Replacement Log Helpers ───────────────────────────────────────────────────

export function getReplacementLog(): ReplacementEvent[] {
  const stored = localStorage.getItem(STORAGE_KEY_REPLACEMENT_LOG);
  return stored ? JSON.parse(stored) : [];
}

export function saveReplacementEvent(event: ReplacementEvent): void {
  const log = getReplacementLog();
  const existingIndex = log.findIndex(e => e.id === event.id);
  if (existingIndex >= 0) {
    log[existingIndex] = event;
  } else {
    log.unshift(event); // newest first
  }
  localStorage.setItem(STORAGE_KEY_REPLACEMENT_LOG, JSON.stringify(log));
}

export function getPendingReplacementCount(): number {
  const log = getReplacementLog();
  return log.filter(e => e.status === 'proposed').length;
}

// ─── Emergency Event Helpers ───────────────────────────────────────────────────

export function getEmergencyEvents(): EmergencyEvent[] {
  const stored = localStorage.getItem(STORAGE_KEY_EMERGENCY_EVENTS);
  return stored ? JSON.parse(stored) : [];
}

export function saveEmergencyEvent(event: EmergencyEvent): void {
  const events = getEmergencyEvents();
  const existingIndex = events.findIndex(e => e.id === event.id);
  if (existingIndex >= 0) {
    events[existingIndex] = event;
  } else {
    events.unshift(event);
  }
  localStorage.setItem(STORAGE_KEY_EMERGENCY_EVENTS, JSON.stringify(events));
}

export function clearEmergencyEvents(): void {
  localStorage.removeItem(STORAGE_KEY_EMERGENCY_EVENTS);
}
