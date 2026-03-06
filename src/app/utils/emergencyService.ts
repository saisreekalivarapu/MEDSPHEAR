import { Patient, EmergencyEvent, Doctor } from '../types';
import { getPatients, updatePatients, saveEmergencyEvent, getEmergencyEvents, getDoctors, updateDoctors } from './storage';
import { chatService } from './chatService';

/**
 * Triggers an emergency for a patient.
 * Updates urgency level, persists emergency event, and sends system notice.
 */
export function triggerEmergency(patientId: string): EmergencyEvent | null {
    const patients = getPatients();
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) return null;

    const patient = patients[patientIndex];

    // Update patient status
    const updatedPatient: Patient = {
        ...patient,
        urgencyLevel: 'critical',
        emergencyStatus: 'active',
        priorityScore: 100 // Maximum priority
    };

    patients[patientIndex] = updatedPatient;
    updatePatients(patients);

    // Create and save emergency event
    const event: EmergencyEvent = {
        id: `emergency_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        patientId: patient.id,
        patientName: patient.name,
        timestamp: new Date().toISOString(),
        status: 'active',
        symptoms: patient.symptoms,
    };

    saveEmergencyEvent(event);

    // Broadcast system message to chat
    chatService.sendMessage(
        patientId,
        `🚨 EMERGENCY PROTOCOL ACTIVATED: Clinical team has been notified. Please remain calm, a doctor is being assigned to your case immediately.`,
        'system'
    );

    return event;
}

/**
 * Resolves an emergency by assigning a doctor immediately.
 */
export function resolveEmergency(eventId: string, doctorId: string): void {
    const events = getEmergencyEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const doctors = getDoctors();
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return;

    const patients = getPatients();
    const patientIndex = patients.findIndex(p => p.id === event.patientId);
    if (patientIndex === -1) return;

    // Update patient
    const patient = patients[patientIndex];
    patients[patientIndex] = {
        ...patient,
        assignedDoctor: doctorId,
        status: 'in-consultation',
        emergencyStatus: 'resolved'
    };
    updatePatients(patients);

    // Update doctor
    const updatedDoctors = doctors.map(d =>
        d.id === doctorId ? { ...d, status: 'busy' as const, currentPatient: event.patientId } : d
    );
    updateDoctors(updatedDoctors);

    // Update event
    saveEmergencyEvent({
        ...event,
        status: 'resolved',
        assignedDoctorId: doctorId,
        assignedDoctorName: doctor.name
    });

    chatService.sendMessage(
        event.patientId,
        `✅ Emergency handled. Dr. ${doctor.name.split(' ').pop()} has been assigned and is reviewing your case now.`,
        'system'
    );
}
