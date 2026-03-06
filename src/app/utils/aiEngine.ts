import { Patient } from '../types';

// AI-based urgency prediction based on symptoms
export function predictUrgency(symptoms: string): 'normal' | 'medium' | 'critical' {
  const lowerSymptoms = symptoms.toLowerCase();
  
  // Critical symptoms
  const criticalKeywords = [
    'chest pain', 'heart attack', 'stroke', 'severe bleeding', 'unconscious',
    'seizure', 'difficulty breathing', 'head injury', 'poisoning', 'severe burn'
  ];
  
  // Medium urgency symptoms
  const mediumKeywords = [
    'high fever', 'severe pain', 'fracture', 'vomiting', 'infection',
    'severe headache', 'abdominal pain', 'deep cut', 'allergic reaction'
  ];
  
  if (criticalKeywords.some(keyword => lowerSymptoms.includes(keyword))) {
    return 'critical';
  }
  
  if (mediumKeywords.some(keyword => lowerSymptoms.includes(keyword))) {
    return 'medium';
  }
  
  return 'normal';
}

// Estimate consultation time based on symptoms and appointment type
export function estimateConsultationTime(
  symptoms: string,
  appointmentType: 'opd' | 'emergency' | 'follow-up',
  urgencyLevel: 'normal' | 'medium' | 'critical'
): number {
  let baseTime = 15; // default 15 minutes
  
  // Adjust based on appointment type
  switch (appointmentType) {
    case 'emergency':
      baseTime = 20;
      break;
    case 'follow-up':
      baseTime = 10;
      break;
    case 'opd':
      baseTime = 15;
      break;
  }
  
  // Adjust based on urgency
  if (urgencyLevel === 'critical') {
    baseTime += 15;
  } else if (urgencyLevel === 'medium') {
    baseTime += 5;
  }
  
  // Add slight randomness (±3 minutes)
  return baseTime + Math.floor(Math.random() * 7) - 3;
}

// Calculate priority score (higher = more urgent)
export function calculatePriorityScore(patient: Partial<Patient>): number {
  let score = 0;
  
  // Urgency level weight
  switch (patient.urgencyLevel) {
    case 'critical':
      score += 100;
      break;
    case 'medium':
      score += 50;
      break;
    case 'normal':
      score += 10;
      break;
  }
  
  // Emergency appointments get priority
  if (patient.appointmentType === 'emergency') {
    score += 30;
  }
  
  // Age factor (elderly and children get slight priority)
  if (patient.age && (patient.age > 65 || patient.age < 10)) {
    score += 10;
  }
  
  // Time waiting factor (add 1 point per 5 minutes waiting)
  if (patient.registrationTime) {
    const waitingMinutes = (Date.now() - new Date(patient.registrationTime).getTime()) / (1000 * 60);
    score += Math.floor(waitingMinutes / 5);
  }
  
  return score;
}

// Optimize queue based on priority scores
export function optimizeQueue(patients: Patient[]): Patient[] {
  const waitingPatients = patients.filter(p => p.status === 'waiting');
  
  // Sort by priority score (descending)
  const sorted = [...waitingPatients].sort((a, b) => {
    // Recalculate priority scores with current time
    const scoreA = calculatePriorityScore(a);
    const scoreB = calculatePriorityScore(b);
    return scoreB - scoreA;
  });
  
  // Update queue positions
  return sorted.map((patient, index) => ({
    ...patient,
    queuePosition: index + 1
  }));
}

// Calculate expected wait time for a patient
export function calculateExpectedWaitTime(
  patient: Patient,
  queue: Patient[],
  availableDoctors: number
): number {
  const patientsAhead = queue.filter(
    p => p.status === 'waiting' && p.queuePosition < patient.queuePosition
  );
  
  const totalConsultationTimeAhead = patientsAhead.reduce(
    (sum, p) => sum + p.estimatedConsultationTime,
    0
  );
  
  // Distribute across available doctors
  const waitTime = Math.ceil(totalConsultationTimeAhead / Math.max(availableDoctors, 1));
  
  return waitTime;
}

// Assign patient to best available doctor
export function assignDoctor(
  patient: Patient,
  doctors: Array<{ id: string; name: string; status: string; specialization: string }>
): string | undefined {
  // Find available doctors
  const availableDoctors = doctors.filter(d => d.status === 'available');
  
  if (availableDoctors.length === 0) {
    return undefined;
  }
  
  // For now, simple round-robin assignment
  // In real AI, this would consider specialization matching
  return availableDoctors[0].name;
}
