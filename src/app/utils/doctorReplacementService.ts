import { Doctor, Patient, DoctorReplacementProposal, ReplacementEvent } from '../types';
import { getDoctors, getPatients, saveReplacementEvent, getReplacementLog } from './storage';

// ─── Unavailability Detection ──────────────────────────────────────────────────

/**
 * Returns a list of patients who have booked the given doctor
 * but the doctor is now offline or busy (unavailable).
 */
export function detectAffectedPatients(doctorId: string): Patient[] {
    const patients = getPatients();
    const doctor = getDoctors().find(d => d.id === doctorId);

    if (!doctor || doctor.status === 'available') return [];

    return patients.filter(
        p =>
            (p.bookedDoctorId === doctorId || p.assignedDoctor === doctorId) &&
            p.status === 'waiting' &&
            p.replacementStatus !== 'accepted' &&
            p.replacementStatus !== 'manual'
    );
}

// ─── Similarity Scoring ────────────────────────────────────────────────────────

/**
 * Computes a 0–100 similarity score between the original doctor and a candidate.
 * Higher = more similar.
 */
function computeSimilarityScore(original: Doctor, candidate: Doctor): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Same specialization is required (already filtered upstream), give base points
    score += 40; // Increased base for specialization
    reasons.push(`Same department: ${candidate.specialization}`);

    // Experience similarity (max 30 pts — penalise large gaps)
    const origExp = original.experience ?? 5;
    const candExp = candidate.experience ?? 5;
    const expDelta = Math.abs(origExp - candExp);
    const expPoints = Math.max(0, 30 - expDelta * 3);
    score += expPoints;
    if (expDelta === 0) reasons.push(`Exact experience match (${candExp} yrs)`);
    else if (expDelta <= 2) reasons.push(`Highly comparable experience (${candExp} yrs)`);
    else if (expDelta <= 5) reasons.push(`Close experience match (${candExp} yrs)`);

    // Rating (max 20 pts)
    const origRating = original.rating ?? 4.0;
    const candRating = candidate.rating ?? 4.0;
    const ratingDelta = Math.abs(origRating - candRating);
    const ratingPoints = Math.max(0, 20 - ratingDelta * 10);
    score += ratingPoints;
    if (ratingDelta <= 0.2) reasons.push(`Comparable patient rating (${candRating.toFixed(1)}★)`);

    // Qualifications overlap bonus (max 10 pts)
    if (original.qualifications && candidate.qualifications) {
        const origTerms = original.qualifications.split(/[,\s]+/).map(t => t.toLowerCase());
        const candTerms = candidate.qualifications.split(/[,\s]+/).map(t => t.toLowerCase());
        const overlap = origTerms.filter(t => candTerms.includes(t) && t.length > 2).length;
        const qualPoints = Math.min(10, overlap * 5);
        score += qualPoints;
        if (qualPoints >= 5) reasons.push('Matching qualifications');
    }

    return { score: Math.round(score), reasons };
}

/**
 * Checks all doctors and returns alerts for those who just went offline/busy
 * and have pending appointments without active proposals.
 */
export function monitorUnavailability(): DoctorUnavailabilityAlert[] {
    const doctors = getDoctors();
    const alerts: DoctorUnavailabilityAlert[] = [];

    doctors.forEach(doctor => {
        if (doctor.status !== 'available') {
            const affected = detectAffectedPatients(doctor.id);
            if (affected.length > 0) {
                const candidates = findReplacementCandidates(doctor.id, doctors);
                alerts.push({ doctor, affectedPatients: affected, replacementCandidates: candidates });
            }
        }
    });

    return alerts;
}

// ─── Candidate Search ──────────────────────────────────────────────────────────

/**
 * Finds and ranks available replacement doctors for an unavailable doctor.
 * Filters by same specialization and available status, then sorts by similarity.
 */
export function findReplacementCandidates(
    originalDoctorId: string,
    allDoctors?: Doctor[]
): DoctorReplacementProposal[] {
    const doctors = allDoctors ?? getDoctors();
    const original = doctors.find(d => d.id === originalDoctorId);
    if (!original) return [];

    const candidates = doctors.filter(
        d =>
            d.id !== originalDoctorId &&
            d.specialization === original.specialization &&
            d.status === 'available'
    );

    return candidates
        .map(candidate => {
            const { score, reasons } = computeSimilarityScore(original, candidate);
            return { doctor: candidate, similarityScore: score, reasons };
        })
        .sort((a, b) => b.similarityScore - a.similarityScore);
}

// ─── Message Builder ───────────────────────────────────────────────────────────

/**
 * Builds a formatted chat message body for a replacement proposal.
 */
export function buildReplacementProposalMessage(
    patient: Patient,
    originalDoctor: Doctor,
    replacement: Doctor,
    proposal: DoctorReplacementProposal
): string {
    const preferredTime = patient.preferredTime
        ? new Date(patient.preferredTime).toLocaleString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'your original appointment slot';

    return [
        `🔔 Doctor Replacement Notice`,
        ``,
        `Dear ${patient.name},`,
        ``,
        `We regret to inform you that your booked doctor, ${originalDoctor.name}, is currently unavailable for your appointment at ${preferredTime}.`,
        ``,
        `We have found a highly qualified replacement from the same department:`,
        ``,
        `👨‍⚕️ Dr. ${replacement.name.replace(/^Dr\.\s*/i, '')}`,
        `   • Specialization : ${replacement.specialization}`,
        `   • Experience     : ${replacement.experience ?? 'N/A'} years`,
        `   • Qualifications : ${replacement.qualifications ?? 'N/A'}`,
        `   • Rating         : ${replacement.rating?.toFixed(1) ?? 'N/A'} ★`,
        `   • Availability   : ${preferredTime}`,
        `   • Match Score    : ${proposal.similarityScore}/100`,
        ``,
        `✅ Please reply ACCEPT to confirm this replacement, or DECLINE if you prefer to choose another doctor or reschedule.`
    ].join('\n');
}

// ─── Event Logging ─────────────────────────────────────────────────────────────

export function logReplacementProposal(
    patient: Patient,
    originalDoctor: Doctor,
    replacementDoctor: Doctor
): ReplacementEvent {
    const event: ReplacementEvent = {
        id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        patientId: patient.id,
        patientName: patient.name,
        originalDoctorId: originalDoctor.id,
        originalDoctorName: originalDoctor.name,
        replacementDoctorId: replacementDoctor.id,
        replacementDoctorName: replacementDoctor.name,
        status: 'proposed',
        initiatedBy: 'admin'
    };
    saveReplacementEvent(event);
    return event;
}

export function updateReplacementEventStatus(
    patientId: string,
    status: ReplacementEvent['status'],
    notes?: string
): void {
    const log = getReplacementLog();
    const event = log.find(e => e.patientId === patientId && e.status === 'proposed');
    if (event) {
        saveReplacementEvent({ ...event, status, notes });
    }
}

// ─── Quick Summary for Admin Alert Banner ─────────────────────────────────────

export interface DoctorUnavailabilityAlert {
    doctor: Doctor;
    affectedPatients: Patient[];
    replacementCandidates: DoctorReplacementProposal[];
}

export function buildUnavailabilityAlert(doctorId: string): DoctorUnavailabilityAlert | null {
    const doctors = getDoctors();
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return null;

    const affectedPatients = detectAffectedPatients(doctorId);
    const replacementCandidates = findReplacementCandidates(doctorId, doctors);

    return { doctor, affectedPatients, replacementCandidates };
}
