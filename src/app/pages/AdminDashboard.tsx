import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import {
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Trash2,
  Sparkles,
  Zap,
  ArrowUpRight,
  MessageSquare,
  Send,
  Plus,
  LayoutDashboard,
  Settings,
  UserSquare2,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Search,
  History,
  UserX,
  Star,
  ClipboardList,
  Stethoscope,
  Bell,
  Phone
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Patient, Doctor, QueueStats, ReplacementEvent, EmergencyEvent } from '../types';
import { getPatients, getDoctors, updatePatients, updateDoctors, clearAllData, getReplacementLog, saveReplacementEvent, getPendingReplacementCount } from '../utils/storage';
import { optimizeQueue, calculateExpectedWaitTime } from '../utils/aiEngine';
import { toast } from 'sonner';
import { sendSMS, smsTemplates } from '../utils/smsService';
import { chatService } from '../utils/chatService';
import { ChatMessage } from '../types';
import { useRef } from 'react';
import {
  buildUnavailabilityAlert,
  findReplacementCandidates,
  buildReplacementProposalMessage,
  logReplacementProposal,
  updateReplacementEventStatus,
  monitorUnavailability,
  DoctorUnavailabilityAlert
} from '../utils/doctorReplacementService';
import { getEmergencyEvents, clearEmergencyEvents } from '../utils/storage';
import { resolveEmergency } from '../utils/emergencyService';

// Custom Components
import { AdminSidebar } from '../components/ui/AdminSidebar';

import { HeartbeatWave } from '../components/ui/HeartbeatWave';
import { MedicalAIOrb } from '../components/3d/MedicalAIOrb';
import { FloatingMedicalIcons } from '../components/3d/FloatingIcons';
import { DoctorProfileCard } from '../components/ui/DoctorProfileCard';
import { DoctorRosters } from '../components/ui/DoctorRosters';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<QueueStats>({
    totalWaiting: 0,
    averageWaitTime: 0,
    criticalPatients: 0,
    completedToday: 0
  });
  const [activeTab, setActiveTab] = useState('queue');
  // Replacement feature state
  const [replacementAlerts, setReplacementAlerts] = useState<DoctorUnavailabilityAlert[]>([]);
  const [replacementLog, setReplacementLog] = useState<ReplacementEvent[]>([]);
  const [pendingReplacements, setPendingReplacements] = useState(0);
  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyEvent[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);

    // Chat subscription
    const unsubscribe = chatService.subscribe((allMessages) => {
      setMessages(allMessages);
    });
    setMessages(chatService.getAllMessages());
    loadReplacementLog();

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const loadReplacementLog = () => {
    setReplacementLog(getReplacementLog());
    setPendingReplacements(getPendingReplacementCount());
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, selectedPatientId]);

  const loadData = () => {
    const allPatients = getPatients();
    const allDoctors = getDoctors();

    const optimized = optimizeQueue(allPatients);
    const availableDoctors = allDoctors.filter(d => d.status === 'available').length;

    const withWaitTimes = optimized.map(patient => ({
      ...patient,
      expectedWaitTime: calculateExpectedWaitTime(patient, optimized, availableDoctors)
    }));

    const allPatientsWithTimes = [
      ...withWaitTimes,
      ...allPatients.filter(p => p.status !== 'waiting')
    ];

    setPatients(allPatientsWithTimes);
    setDoctors(allDoctors);

    // Check for Active Emergencies
    const emergencies = getEmergencyEvents().filter(e => e.status === 'active');
    setActiveEmergencies(emergencies);

    // Automated Monitoring for Doctor Unavailability
    const activeAlerts = monitorUnavailability();
    if (activeAlerts.length > 0) {
      setReplacementAlerts(prev => {
        // Track which doctors are still unavailable
        const currentDoctorIds = activeAlerts.map(a => a.doctor.id);

        // Filter out dismissed alerts for doctors who are no longer in activeAlerts
        const updatedPrev = prev.filter(a => currentDoctorIds.includes(a.doctor.id));

        // Use new data from activeAlerts for all unavailable doctors,
        // but preserve the "visible" state if we had a way to dismiss (currently we just remove from state)
        // Wait, if I dismissing an alert, I remove it from replacementAlerts.
        // If I want to avoid re-showing a dismissed alert in the SAME session:
        const alreadyDismissed = prev.length > 0 ? [] : []; // We don't have a persistence for dismissal yet.

        // For simplicity: Update all alerts with fresh info (candidates/patients)
        // but only if they were not dismissed in this cycle.
        // Actually, just returning activeAlerts is most state-consistent for a "Live" dashboard.
        if (activeAlerts.length > updatedPrev.length) {
          toast.warning('System Alert: Doctor Unavailability Detected', {
            description: `${activeAlerts.length} doctor(s) are offline with pending patients.`
          });
        }
        return activeAlerts;
      });
    } else if (replacementAlerts.length > 0) {
      setReplacementAlerts([]);
    }

    const waiting = allPatientsWithTimes.filter(p => p.status === 'waiting');
    const critical = waiting.filter(p => p.urgencyLevel === 'critical');
    const completed = allPatientsWithTimes.filter(p => p.status === 'completed');
    const avgWait = waiting.length > 0
      ? Math.round(waiting.reduce((sum, p) => sum + (p.expectedWaitTime || 0), 0) / waiting.length)
      : 0;

    setStats({
      totalWaiting: waiting.length,
      criticalPatients: critical.length,
      averageWaitTime: avgWait,
      completedToday: completed.length
    });
  };

  const handleStartConsultation = (patientId: string) => {
    const updatedPatients = patients.map(p =>
      p.id === patientId ? { ...p, status: 'in-consultation' as const } : p
    );

    const availableDoctor = doctors.find(d => d.status === 'available');
    if (availableDoctor) {
      const updatedDoctors = doctors.map(d =>
        d.id === availableDoctor.id
          ? { ...d, status: 'busy' as const, currentPatient: patientId }
          : d
      );
      updateDoctors(updatedDoctors);
      setDoctors(updatedDoctors);
    }

    updatePatients(updatedPatients);
    setPatients(updatedPatients);
    toast.success('Consultation started');

    // Trigger consultation start SMS
    const currentPatient = updatedPatients.find(p => p.id === patientId);
    if (currentPatient) {
      sendSMS(currentPatient.phoneNumber, smsTemplates.consultationStart(currentPatient.name));
    }
  };

  const handleCompleteConsultation = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    const updatedPatients = patients.map(p =>
      p.id === patientId ? { ...p, status: 'completed' as const } : p
    );

    const busyDoctor = doctors.find(d => d.currentPatient === patientId);
    if (busyDoctor) {
      const updatedDoctors = doctors.map(d =>
        d.id === busyDoctor.id
          ? {
            ...d,
            status: 'available' as const,
            currentPatient: undefined,
            patientsToday: d.patientsToday + 1
          }
          : d
      );
      updateDoctors(updatedDoctors);
      setDoctors(updatedDoctors);
    }

    updatePatients(updatedPatients);
    setPatients(updatedPatients);
    toast.success(`${patient?.name}'s consultation completed`);

    // Trigger consultation complete SMS
    if (patient) {
      sendSMS(patient.phoneNumber, smsTemplates.consultationComplete(patient.name));
    }
  };

  const toggleDoctorStatus = (doctorId: string) => {
    const updatedDoctors = doctors.map(d => {
      if (d.id === doctorId) {
        const newStatus = d.status === 'available' ? 'offline' : 'available';
        return { ...d, status: newStatus as 'available' | 'offline' };
      }
      return d;
    });
    updateDoctors(updatedDoctors);
    setDoctors(updatedDoctors);
    toast.success('Doctor status updated');

    const updatedDoctor = updatedDoctors.find(d => d.id === doctorId);
    if (updatedDoctor?.status === 'available') {
      // Doctor came back online — clear their alert
      setReplacementAlerts(prev => prev.filter(a => a.doctor.id !== doctorId));
      const waiting = patients.filter(p => p.status === 'waiting');
      const nextPatient = waiting[0];
      if (nextPatient) {
        sendSMS(
          nextPatient.phoneNumber,
          smsTemplates.doctorAvailable(nextPatient.name, nextPatient.expectedWaitTime || 0)
        );
      }
    } else if (updatedDoctor?.status === 'offline') {
      // Doctor went offline — compute replacement alerts
      const alert = buildUnavailabilityAlert(doctorId);
      if (alert && alert.affectedPatients.length > 0) {
        setReplacementAlerts(prev => {
          const filtered = prev.filter(a => a.doctor.id !== doctorId);
          return [...filtered, alert];
        });
        toast.warning(
          `${updatedDoctor.name} is offline`,
          { description: `${alert.affectedPatients.length} patient(s) need replacement. Check Doctors tab.` }
        );
      }
    }
  };

  const handleImmediateEmergencyAssignment = (eventId: string) => {
    const availableDoctor = doctors.find(d => d.status === 'available');
    if (!availableDoctor) {
      toast.error('Assignment Failed', {
        description: 'No doctors are currently available. Please reassign a doctor from another case manually.'
      });
      return;
    }

    resolveEmergency(eventId, availableDoctor.id);
    loadData();
    toast.success('Doctor Assigned', {
      description: `Dr. ${availableDoctor.name.split(' ').pop()} has been dispatched to the emergency.`
    });
  };

  const handleSendReplacementProposal = () => {
    if (!selectedPatientId) return;
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    const doctorId = patient.bookedDoctorId || patient.assignedDoctor;
    if (!doctorId) {
      toast.error('No booked doctor found for this patient');
      return;
    }

    const candidates = findReplacementCandidates(doctorId, doctors);
    if (candidates.length === 0) {
      toast.error('No available replacement doctors found in the same department');
      return;
    }

    const originalDoctor = doctors.find(d => d.id === doctorId);
    if (!originalDoctor) return;

    const bestReplacement = candidates[0];
    const messageText = buildReplacementProposalMessage(patient, originalDoctor, bestReplacement.doctor, bestReplacement);

    // Send via chat as a system message with replacement_proposal type
    const stored = localStorage.getItem('medspear_chat_messages');
    const allMessages: ChatMessage[] = stored ? JSON.parse(stored) : [];
    const newMsg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      patientId: selectedPatientId,
      text: messageText,
      sender: 'system',
      timestamp: new Date().toISOString(),
      messageType: 'replacement_proposal',
      replacementDoctorId: bestReplacement.doctor.id
    };
    allMessages.push(newMsg);
    localStorage.setItem('medspear_chat_messages', JSON.stringify(allMessages));
    chatService.notify();

    // Update patient's replacementStatus to pending
    const updatedPatients = patients.map(p =>
      p.id === selectedPatientId ? { ...p, replacementStatus: 'pending' as const, bookedDoctorId: p.bookedDoctorId || p.assignedDoctor } : p
    );
    updatePatients(updatedPatients);
    setPatients(updatedPatients);

    // Log the event
    logReplacementProposal(patient, originalDoctor, bestReplacement.doctor);
    loadReplacementLog();

    toast.success('Replacement proposal sent to patient via chat', {
      description: `Proposed: ${bestReplacement.doctor.name} (${bestReplacement.similarityScore}/100 match)`
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !replyText.trim()) return;

    chatService.sendMessage(selectedPatientId, replyText, 'doctor');
    setReplyText('');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all patient data? This cannot be undone.')) {
      clearAllData();
      loadData();
      toast.success('All data cleared');
    }
  };

  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const inConsultation = patients.filter(p => p.status === 'in-consultation');
  const completed = patients.filter(p => p.status === 'completed');

  return (
    <div className="flex min-h-screen bg-[#f8fafc] overflow-hidden">

      {/* Emergency Alert Protocol Popups */}
      <AnimatePresence>
        {activeEmergencies.map((emergency) => (
          <motion.div
            key={emergency.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <Card className="w-full max-w-lg rounded-[40px] border-red-200 bg-white shadow-[0_0_100px_rgba(239,68,68,0.3)] overflow-hidden border-4">
              <div className="bg-red-600 p-8 text-white text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                    <AlertCircle size={48} className="text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-black tracking-tighter mb-2">CRITICAL EMERGENCY</h2>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Triage Alert</p>
                </div>
              </div>
              <CardContent className="p-10 text-center">
                <div className="mb-8">
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">Patient Identified</p>
                  <h3 className="text-2xl font-black text-slate-800 mb-1">{emergency.patientName}</h3>
                  <p className="text-red-600 font-bold text-sm">Someone is in critical situation assign a doctor.</p>
                </div>

                <div className="p-6 rounded-3xl bg-red-50 border border-red-100 mb-10">
                  <p className="text-xs font-bold text-red-900 mb-1 italic">"{emergency.symptoms}"</p>
                  <p className="text-[10px] font-black uppercase text-red-400 tracking-widest">Symptom Matrix Assessment</p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => handleImmediateEmergencyAssignment(emergency.id)}
                    className="h-16 rounded-[24px] bg-red-600 hover:bg-black text-white font-black text-lg uppercase tracking-widest shadow-2xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <UserCheck className="h-6 w-6" />
                    Assign Doctor Immediately
                  </Button>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    AI recommendation prioritized by available response latency
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3D Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
          <Suspense fallback={null}>
            {/* @ts-ignore - Intrinsic R3F elements */}
            <ambientLight intensity={0.4} />
            {/* @ts-ignore - Intrinsic R3F elements */}
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <FloatingMedicalIcons />
          </Suspense>
        </Canvas>
      </div>

      <main className="flex-1 ml-72 p-10 relative z-10 overflow-y-auto h-screen custom-scrollbar">
        {/* Top Navigation / Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <span>Main Portal</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-blue-600">Enterprise Administration</span>
            </div>
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter">Clinical Command</h1>
          </div>

          <div className="flex items-center gap-6">
            <HeartbeatWave />
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" onClick={loadData} className="rounded-2xl border-white/40 bg-white/40 backdrop-blur-xl h-12 px-6 font-bold shadow-lg shadow-blue-100 hover:shadow-blue-200">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Nexus
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="destructive" onClick={handleClearData} className="rounded-2xl h-12 px-6 font-bold shadow-xl shadow-red-100 active:scale-95 transition-all">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Format Memory
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Hero Section with 3D Orb */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          <div className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full rounded-[40px] bg-gradient-to-br from-blue-600 to-cyan-500 p-10 relative overflow-hidden shadow-2xl shadow-blue-200"
            >
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-50">
                <Canvas shadows>
                  <PerspectiveCamera makeDefault position={[0, 0, 4]} />
                  <Suspense fallback={null}>
                    {/* @ts-ignore - Intrinsic R3F elements */}
                    <ambientLight intensity={0.5} />
                    {/* @ts-ignore - Intrinsic R3F elements */}
                    <pointLight position={[5, 5, 5]} />
                    <MedicalAIOrb />
                  </Suspense>
                </Canvas>
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between max-w-lg">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Badge className="bg-white/20 text-white backdrop-blur-md border-none px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
                      AI-ORCHESTRATED
                    </Badge>
                  </div>
                  <h2 className="text-5xl font-black text-white tracking-tighter mb-4 leading-none">Intelligence Hub</h2>
                  <p className="text-blue-50/80 font-medium text-lg leading-relaxed">
                    Automated triage is currently optimizing 12 incoming patient streams with 98.4% efficiency.
                  </p>
                </div>

                <div className="mt-10 flex gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex-1">
                    <p className="text-[10px] text-white font-black uppercase tracking-widest mb-1 opacity-60">System Load</p>
                    <p className="text-2xl font-black text-white tracking-tighter">Normal Operating</p>
                    <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "65%" }}
                        className="h-full bg-white"
                      />
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex-1">
                    <p className="text-[10px] text-white font-black uppercase tracking-widest mb-1 opacity-60">Security Level</p>
                    <p className="text-2xl font-black text-white tracking-tighter">Bio-Secure V3</p>
                    <div className="flex gap-1 mt-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 4 ? "bg-white" : "bg-white/20"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-6">
            {[
              { icon: Users, label: 'Waiting', val: stats.totalWaiting, color: 'text-blue-600', bg: 'bg-blue-500/10' },
              { icon: AlertCircle, label: 'Critical', val: stats.criticalPatients, color: 'text-red-600', bg: 'bg-red-500/10', pulse: true },
              { icon: Clock, label: 'Avg Wait', val: `${stats.averageWaitTime}m`, color: 'text-orange-600', bg: 'bg-orange-500/10' },
              { icon: CheckCircle, label: 'Success', val: stats.completedToday, color: 'text-emerald-600', bg: 'bg-emerald-500/10' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5, scale: 1.02 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 rounded-[32px] p-6 flex flex-col justify-between items-center group relative overflow-hidden h-full"
              >
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} mb-4 relative z-10`}>
                  <stat.icon className={`h-6 w-6 ${stat.pulse ? 'animate-pulse' : ''}`} />
                </div>
                <div className="text-center relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.val}</p>
                </div>
                {stat.pulse && <div className="absolute inset-0 bg-red-500/5 animate-pulse" />}
              </motion.div>
            ))}
          </div>
        </div>

        {/* GLOBAL Replacement Alert Banners */}
        {replacementAlerts.length > 0 && (
          <div className="mb-10 space-y-4">
            {replacementAlerts.map((alert) => (
              <motion.div
                key={alert.doctor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[32px] border-2 border-amber-200 bg-gradient-to-br from-amber-50/90 to-orange-50/90 backdrop-blur-2xl p-8 shadow-2xl shadow-amber-200/20 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-10 text-amber-500/5 group-hover:scale-110 transition-transform duration-700">
                  <Bell size={200} />
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center gap-8 relative z-10">
                  <div className="h-20 w-20 rounded-3xl bg-amber-500/10 flex items-center justify-center border-2 border-amber-200/50">
                    <Bell className="h-10 w-10 text-amber-600 animate-bounce" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-amber-600 text-white font-black px-2 py-0.5 rounded-lg border-none animate-pulse">CRITICAL ALERT</Badge>
                      <h3 className="font-black text-slate-900 tracking-tight text-2xl">
                        Doctor Unavailability Detected
                      </h3>
                    </div>
                    <p className="text-lg text-slate-600 font-medium max-w-2xl">
                      <span className="font-black text-amber-700 underline underline-offset-4 decoration-amber-200">{alert.doctor.name}</span> is currently {alert.doctor.status}.
                      There are <span className="font-black">{alert.affectedPatients.length} patient(s)</span> requiring immediate reassignment in the <span className="uppercase font-bold tracking-tight">{alert.doctor.specialization}</span> department.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => {
                        setActiveTab('chat');
                        if (alert.affectedPatients.length > 0) {
                          setSelectedPatientId(alert.affectedPatients[0].id);
                        }
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black h-16 px-8 py-4 shadow-xl shadow-amber-200 transition-all active:scale-95"
                    >
                      REASSIGN VIA CHAT
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setReplacementAlerts(prev => prev.filter(a => a.doctor.id !== alert.doctor.id))}
                      className="text-slate-400 hover:text-slate-600 hover:bg-white/50 text-xs font-black tracking-widest uppercase px-6 h-16 rounded-2xl transition"
                    >
                      Ignore
                    </Button>
                  </div>
                </div>

                {/* Recommendations Preview */}
                <div className="mt-8 pt-8 border-t border-amber-200/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Top AI-Ranked Replacement Candidates</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {alert.replacementCandidates.length > 0 ? (
                      alert.replacementCandidates.slice(0, 4).map((candidate, idx) => (
                        <div
                          key={candidate.doctor.id}
                          className={cn(
                            "p-5 rounded-3xl border-2 transition-all duration-300",
                            idx === 0 ? "bg-white border-emerald-400 shadow-lg shadow-emerald-100 ring-4 ring-emerald-50" : "bg-white/40 border-slate-100 hover:border-amber-200 hover:bg-white"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                              idx === 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                            )}>
                              {idx === 0 ? 'Optimal Match' : `Candidate #${idx + 1}`}
                            </span>
                            <span className="ml-auto font-black text-emerald-600 text-[10px]">{candidate.similarityScore}%</span>
                          </div>
                          <p className="font-black text-slate-800 text-base tracking-tight mb-1">{candidate.doctor.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">{candidate.doctor.experience}Y EXP • {candidate.doctor.rating?.toFixed(1)}★</p>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-1000", idx === 0 ? "bg-emerald-500" : "bg-amber-400")}
                              style={{ width: `${candidate.similarityScore}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full p-6 rounded-3xl bg-red-50 border-2 border-red-100 flex items-center gap-4">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                        <p className="text-sm text-red-700 font-black tracking-tight">NO ELIGIBLE REPLACEMENTS FOUND IN THIS SPECIALIZATION</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Dynamic Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/60 shadow-inner backdrop-blur-xl border border-white p-1.5 rounded-[24px] inline-flex flex-wrap gap-1">
            <TabsTrigger value="queue" className="rounded-[18px] px-8 py-3 font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600">
              Active Streams ({waitingPatients.length + inConsultation.length})
            </TabsTrigger>
            <TabsTrigger value="doctors" className="rounded-[18px] px-8 py-3 font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600">
              Doctor Rosters
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-[18px] px-8 py-3 font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 relative">
              Patient Inquiries
              {pendingReplacements > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[9px] font-black bg-amber-500 text-white rounded-full animate-pulse">{pendingReplacements}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-[18px] px-8 py-3 font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600">
              Archive Metrics
            </TabsTrigger>
            <TabsTrigger value="doctors-master" className="rounded-[18px] px-8 py-3 font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600">
              Doctor Master
            </TabsTrigger>
            <TabsTrigger value="replacement-log" className="rounded-[18px] px-8 py-3 font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-amber-600 relative">
              Replacement Log
              {replacementLog.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[9px] font-black bg-amber-100 text-amber-700 rounded-full border border-amber-200">{replacementLog.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="queue">
              <div className="grid lg:grid-cols-2 gap-10">
                {/* Waiting Patients */}
                <Card className="rounded-[32px] border-white/50 bg-white/40 backdrop-blur-xl shadow-2xl shadow-blue-50/50">
                  <CardHeader className="p-8">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Users className="h-6 w-6 text-blue-600" />
                        Live Ingest Queue
                      </CardTitle>
                      <Badge className="bg-blue-600 text-white border-none font-black px-3 py-1">
                        {waitingPatients.length} NOMINAL
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    {waitingPatients.length === 0 ? (
                      <div className="text-center py-20 flex flex-col items-center opacity-30">
                        <Sparkles className="h-12 w-12 mb-4" />
                        <p className="font-bold text-slate-500 tracking-tight">Zero latency streams detected.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {waitingPatients.map((patient) => (
                          <motion.div
                            key={patient.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.01 }}
                            className="bg-white/80 p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-6">
                              <div className="h-14 w-14 rounded-2xl bg-blue-50 flex flex-col items-center justify-center border border-blue-100/50">
                                <span className="text-[10px] font-black text-blue-400 uppercase leading-none">POS</span>
                                <span className="text-xl font-black text-blue-600 tracking-tighter leading-none mt-1">#{patient.queuePosition}</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight mb-0.5">{patient.name}</h4>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-tight">
                                  <span>{patient.age}Y</span>
                                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                  <span className="uppercase text-blue-600 font-black">{patient.appointmentType}</span>
                                  {patient.isFollowUp && (
                                    <>
                                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-black text-[9px] uppercase tracking-wider px-2 py-0">
                                        Follow-Up Patient
                                      </Badge>
                                    </>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1 mt-2">
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Phone className="h-3 w-3" />
                                    {patient.phoneNumber}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Stethoscope className="h-3 w-3" />
                                    Assigned: {doctors.find(d => d.id === (patient.assignedDoctor || patient.bookedDoctorId))?.name || 'Pending'}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Clock className="h-3 w-3" />
                                    Time: {new Date(patient.preferredTime).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Impact</p>
                                <p className={`text-sm font-black uppercase ${patient.urgencyLevel === 'critical' ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
                                  {patient.urgencyLevel}
                                </p>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStartConsultation(patient.id)}
                                className="h-12 w-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 flex items-center justify-center group-hover:bg-blue-700 transition-colors"
                              >
                                <ArrowUpRight className="h-5 w-5" />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Consultations */}
                <Card className="rounded-[32px] border-white/50 bg-white/40 backdrop-blur-xl shadow-2xl shadow-blue-50/50 border-blue-200/20">
                  <CardHeader className="p-8">
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                      <Activity className="h-6 w-6 text-cyan-600" />
                      Active Operations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    {inConsultation.length === 0 ? (
                      <div className="text-center py-20 flex flex-col items-center opacity-30">
                        <Zap className="h-12 w-12 mb-4" />
                        <p className="font-bold text-slate-500 tracking-tight">No active clinical streams.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {inConsultation.map((patient) => (
                          <motion.div
                            key={patient.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-200 flex items-center justify-between border border-blue-400/30"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                  <UserCheck className="h-6 w-6 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-blue-600 animate-pulse" />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-white tracking-tight mb-0.5">{patient.name}</h4>
                                <p className="text-blue-100/60 text-xs font-bold uppercase tracking-widest">In Consultation</p>
                              </div>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCompleteConsultation(patient.id)}
                              className="bg-white text-blue-600 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/10"
                            >
                              Dispatch
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="doctors">
              <DoctorRosters doctors={doctors} onToggleStatus={toggleDoctorStatus} />
            </TabsContent>

            <TabsContent value="doctors-master">
              <Card className="rounded-[32px] border-white/50 bg-white/40 backdrop-blur-xl shadow-2xl p-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Doctor Provisioning</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const newDoctor: Doctor = {
                      id: Date.now().toString(),
                      name: formData.get('name') as string,
                      specialization: formData.get('specialization') as string,
                      status: 'available',
                      averageConsultationTime: parseInt(formData.get('time') as string) || 15,
                      patientsToday: 0
                    };
                    const updatedDoctors = [...doctors, newDoctor];
                    updateDoctors(updatedDoctors);
                    setDoctors(updatedDoctors);
                    toast.success('New specialist provisioned successfully');
                    e.currentTarget.reset();
                  }}>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Doctor Full Name</Label>
                        <Input name="name" placeholder="e.g. Dr. John Smith" required className="rounded-2xl h-12" />
                      </div>
                      <div className="space-y-2">
                        <Label>Medical Specialization</Label>
                        <Select name="specialization" required>
                          <SelectTrigger className="rounded-2xl h-12">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="General Physician">General Physician</SelectItem>
                            <SelectItem value="Gynecologist">Gynecologist</SelectItem>
                            <SelectItem value="Dentist">Dentist</SelectItem>
                            <SelectItem value="Orthopedic">Orthopedic</SelectItem>
                            <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                            <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                            <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                            <SelectItem value="ENT">ENT</SelectItem>
                            <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Experience (Years)</Label>
                        <Input name="exp" type="number" placeholder="10" className="rounded-2xl h-12" />
                      </div>
                      <div className="space-y-2">
                        <Label>Rating (1-5)</Label>
                        <Input name="rating" type="number" step="0.1" placeholder="4.5" className="rounded-2xl h-12" />
                      </div>
                      <div className="space-y-2">
                        <Label>Qualifications</Label>
                        <Input name="quals" placeholder="e.g. MBBS, MD" className="rounded-2xl h-12" />
                      </div>
                      <div className="space-y-2">
                        <Label>Avg. Consultation Time (min)</Label>
                        <Input name="time" type="number" placeholder="15" className="rounded-2xl h-12" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-14 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 uppercase tracking-widest text-sm">
                      <Plus className="mr-2 h-5 w-5" />
                      Add Specialist to Roster
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat">
              <div className="grid lg:grid-cols-12 gap-8 h-[600px]">
                {/* Patient List */}
                <Card className="lg:col-span-4 rounded-[32px] border-white/50 bg-white/40 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
                  <CardHeader className="p-6 border-b border-white/20">
                    <CardTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Patient Streams
                    </CardTitle>
                  </CardHeader>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {patients.filter(p => p.status !== 'completed').map(patient => (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedPatientId(patient.id)}
                        className={cn(
                          "w-full p-4 rounded-2xl flex items-center gap-4 transition-all border",
                          selectedPatientId === patient.id
                            ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-200"
                            : "bg-white/60 text-slate-700 border-transparent hover:bg-white"
                        )}
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center font-black",
                          selectedPatientId === patient.id ? "bg-white/20" : "bg-blue-50 text-blue-600"
                        )}>
                          {patient.name.charAt(0)}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-bold truncate leading-none mb-1">{patient.name}</p>
                          <p className={cn(
                            "text-[10px] items-center gap-1.5 flex font-black uppercase tracking-widest",
                            selectedPatientId === patient.id ? "text-blue-100" : "text-slate-400"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full animate-pulse",
                              patient.status === 'in-consultation' ? "bg-emerald-400" : "bg-orange-400"
                            )} />
                            {patient.status}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Chat Panel */}
                <Card className="lg:col-span-8 rounded-[32px] border-white/50 bg-white/40 backdrop-blur-xl shadow-xl flex flex-col overflow-hidden">
                  {selectedPatientId ? (
                    <>
                      <CardHeader className="p-6 border-b border-white/20 bg-white/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-200">
                              {patients.find(p => p.id === selectedPatientId)?.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-black text-slate-800 tracking-tight leading-none mb-1">
                                {patients.find(p => p.id === selectedPatientId)?.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Triage Stream</p>
                                {patients.find(p => p.id === selectedPatientId)?.assignedDoctor && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                      Assigned: {doctors.find(d => d.id === patients.find(p => p.id === selectedPatientId)?.assignedDoctor)?.name || 'Specialist'}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.filter(m => m.patientId === selectedPatientId).map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex flex-col max-w-[80%]",
                              msg.sender === 'doctor' ? "ml-auto items-end" : "items-start"
                            )}
                          >
                            <div className={cn(
                              "px-4 py-3 rounded-2xl text-sm font-medium shadow-sm",
                              msg.sender === 'doctor'
                                ? "bg-blue-600 text-white rounded-br-none"
                                : msg.sender === 'system'
                                  ? "bg-slate-200/50 text-slate-600 rounded-bl-none border border-slate-300/30"
                                  : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
                            )}>
                              {msg.text}
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 px-1">
                              {msg.sender === 'doctor' ? 'Clinical Staff' : msg.sender === 'system' ? 'Aura Hub' : 'Patient'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="px-6 pt-3 bg-white/20 border-t border-white/10">
                        {(() => {
                          const selPt = patients.find(p => p.id === selectedPatientId);
                          const hasPendingReplacement = selPt?.replacementStatus === 'pending';
                          const hasDoctorBooked = !!(selPt?.bookedDoctorId || selPt?.assignedDoctor);
                          return hasDoctorBooked && !hasPendingReplacement ? (
                            <Button
                              type="button"
                              onClick={handleSendReplacementProposal}
                              className="w-full h-10 mb-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-amber-100 flex items-center justify-center gap-2"
                            >
                              <Stethoscope className="h-4 w-4" />
                              Send Replacement Proposal
                            </Button>
                          ) : hasPendingReplacement ? (
                            <div className="w-full h-10 mb-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center gap-2">
                              <Bell className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Replacement Proposal Sent — Awaiting Response</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <form onSubmit={handleSendReply} className="p-6 bg-white/30 border-t border-white/20 flex gap-3">
                        <Input
                          placeholder="Respond to patient..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="rounded-2xl border-white/60 bg-white/50 h-12"
                        />
                        <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 shrink-0">
                          <Send className="h-5 w-5" />
                        </Button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-12">
                      <MessageSquare className="h-16 w-16 mb-4 text-slate-400" />
                      <h4 className="text-xl font-black text-slate-800 mb-2">Select a Patient Stream</h4>
                      <p className="text-sm font-bold text-slate-500 max-w-xs">Initialize a secure connection to begin real-time clinical triage.</p>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card className="rounded-[32px] border-white/50 bg-white/40 backdrop-blur-xl shadow-2xl shadow-blue-50/50">
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-slate-600" />
                    Ingress History
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  {completed.length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                      <p className="font-bold text-slate-500 tracking-tight">No archived records for current cycle.</p>
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-2 gap-4">
                      {completed.map((patient) => (
                        <div key={patient.id} className="bg-white/60 p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <h5 className="font-black text-slate-800 tracking-tight">{patient.name}</h5>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient.appointmentType}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase text-emerald-600 border-emerald-100">Verified</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Replacement Log Tab ──────────────────────────────── */}
            <TabsContent value="replacement-log">
              <Card className="rounded-[32px] border-white/50 bg-white/40 backdrop-blur-xl shadow-2xl shadow-amber-50/50">
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                      <ClipboardList className="h-6 w-6 text-amber-600" />
                      Replacement Audit Log
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadReplacementLog}
                      className="rounded-2xl border-white/40 bg-white/40 backdrop-blur-xl h-10 px-4 font-bold text-xs shadow-sm"
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  {replacementLog.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center opacity-30">
                      <ClipboardList className="h-12 w-12 mb-4" />
                      <p className="font-bold text-slate-500 tracking-tight">No replacement events recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {replacementLog.map((event) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white/60 p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                          <div className={cn(
                            "p-3 rounded-2xl shrink-0",
                            event.status === 'accepted' ? 'bg-emerald-50' :
                              event.status === 'declined' ? 'bg-red-50' :
                                event.status === 'manual' ? 'bg-blue-50' :
                                  'bg-amber-50'
                          )}>
                            <Stethoscope className={cn(
                              "h-5 w-5",
                              event.status === 'accepted' ? 'text-emerald-600' :
                                event.status === 'declined' ? 'text-red-500' :
                                  event.status === 'manual' ? 'text-blue-600' :
                                    'text-amber-600'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-black text-slate-800 tracking-tight">{event.patientName}</span>
                              <Badge
                                className={cn(
                                  "text-[9px] font-black uppercase border-none px-2 py-0.5",
                                  event.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                    event.status === 'declined' ? 'bg-red-100 text-red-600' :
                                      event.status === 'manual' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                )}
                              >
                                {event.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              <span className="text-slate-400">Original:</span> {event.originalDoctorName}
                              {event.replacementDoctorName && (
                                <> → <span className="text-blue-600 font-bold">{event.replacementDoctorName}</span></>
                              )}
                            </p>
                            {event.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{event.notes}</p>}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {new Date(event.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400">
                              {new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>

      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-10 right-10 z-50 group"
      >
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-blue-500 rounded-full blur-2xl"
          />
          <div className="w-16 h-16 bg-white/30 backdrop-blur-2xl border border-white/50 rounded-full flex items-center justify-center shadow-2xl relative z-10 cursor-pointer overflow-hidden">
            <div className="absolute inset-0">
              <Canvas>
                {/* @ts-ignore - Intrinsic R3F elements */}
                <ambientLight intensity={0.5} />
                {/* @ts-ignore - Intrinsic R3F elements */}
                <pointLight position={[2, 2, 2]} />
                <MedicalAIOrb />
              </Canvas>
            </div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping z-20" />
          </div>
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <p className="text-[10px] font-black tracking-widest uppercase">Medspear AI-7</p>
            <p className="text-xs font-bold text-slate-400">Waiting for query...</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
