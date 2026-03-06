export interface Patient {
  id: string;
  name: string;
  phoneNumber: string;
  age: number;
  symptoms: string;
  appointmentType: 'opd' | 'emergency' | 'follow-up' | string;
  preferredTime: string;
  registrationTime: string;
  urgencyLevel: 'normal' | 'medium' | 'critical';
  priorityScore: number;
  estimatedConsultationTime: number; // in minutes
  status: 'waiting' | 'in-consultation' | 'completed';
  queuePosition: number;
  assignedDoctor?: string;
  expectedWaitTime?: number; // in minutes
  // Doctor Replacement fields
  bookedDoctorId?: string;         // original booked doctor ID
  replacementStatus?: 'pending' | 'accepted' | 'declined' | 'manual'; // consent state
  emergencyStatus?: 'active' | 'resolved' | 'none';
  // Follow-up system fields
  isFollowUp?: boolean;
  previouslyConsultedDoctorId?: string;
  consultationCount?: number;
  lastSpecialist?: string;
  lastDepartment?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  status: 'available' | 'busy' | 'offline';
  currentPatient?: string;
  averageConsultationTime: number;
  patientsToday: number;
  // Extended profile for replacement matching
  experience?: number;        // years of experience
  rating?: number;            // 1–5 star rating
  qualifications?: string;    // e.g. "MBBS, MD, FRCS"
}

export interface QueueStats {
  totalWaiting: number;
  averageWaitTime: number;
  criticalPatients: number;
  completedToday: number;
}

export interface ChatMessage {
  id: string;
  patientId: string;
  doctorId?: string; // Optional: if the message is for a specific doctor
  text: string;
  sender: 'system' | 'doctor' | 'patient';
  timestamp: string;
  // Replacement proposal metadata
  messageType?: 'replacement_proposal' | 'standard';
  replacementDoctorId?: string; // proposed replacement doctor ID
}

// Audit log entry for every replacement action
export interface ReplacementEvent {
  id: string;
  timestamp: string;
  patientId: string;
  patientName: string;
  originalDoctorId: string;
  originalDoctorName: string;
  replacementDoctorId?: string;
  replacementDoctorName?: string;
  status: 'proposed' | 'accepted' | 'declined' | 'manual';
  notes?: string;
  initiatedBy: 'admin' | 'system';
}

// Scored replacement candidate
export interface DoctorReplacementProposal {
  doctor: Doctor;
  similarityScore: number;
  reasons: string[];
}

export interface EmergencyEvent {
  id: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  status: 'active' | 'resolved';
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  symptoms: string;
}
