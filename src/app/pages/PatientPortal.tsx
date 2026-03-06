import * as React from 'react';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Activity, Calendar, Clock, User, Stethoscope, Sparkles, Heart, Zap, Shield, Search, MessageSquare, Phone } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { MedicalAIOrb } from '../components/3d/MedicalAIOrb';
import { Patient, Doctor } from '../types';
import { predictUrgency, estimateConsultationTime, calculatePriorityScore } from '../utils/aiEngine';
import { savePatient, getPatients, getDoctors, setCurrentPatient, checkFollowUpEligibility } from '../utils/storage';
import { optimizeQueue } from '../utils/aiEngine';
import { updatePatients } from '../utils/storage';
import { sendSMS, smsTemplates } from '../utils/smsService';
import { ChatWidget } from '../components/ui/ChatWidget';
import { CheckCircle2, History } from 'lucide-react';

export function PatientPortal() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    age: '',
    symptoms: '',
    appointmentType: 'opd' as 'opd' | 'emergency' | 'follow-up',
    preferredTime: ''
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [bookingMethod, setBookingMethod] = useState<'chat' | 'call' | null>(null);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followUpEligible, setFollowUpEligible] = useState<{ isEligible: boolean, history: Patient[] }>({
    isEligible: false,
    history: []
  });

  useEffect(() => {
    if (formData.name && formData.phoneNumber && formData.age) {
      const eligibility = checkFollowUpEligibility(
        formData.name,
        formData.phoneNumber,
        parseInt(formData.age)
      );
      setFollowUpEligible(eligibility);

      // If eligible and has history, pre-select previously consulted doctor if possible
      if (eligibility.isEligible && eligibility.history.length > 0) {
        const lastBooking = [...eligibility.history].sort((a, b) =>
          new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime()
        )[0];
        if (lastBooking.assignedDoctor || lastBooking.bookedDoctorId) {
          setSelectedDoctorId(lastBooking.assignedDoctor || lastBooking.bookedDoctorId || '');
          setFormData(prev => ({ ...prev, appointmentType: lastBooking.appointmentType as any }));
        }
      }
    } else {
      setFollowUpEligible({ isEligible: false, history: [] });
    }
  }, [formData.name, formData.phoneNumber, formData.age]);

  useEffect(() => {
    // Load doctors for selection
    const availableDoctors = getDoctors();
    setDoctors(availableDoctors);
  }, []);

  const departmentDoctors = useMemo(() => {
    // Basic mapping if specialization doesn't exactly match appointmentType label
    const deptMap: Record<string, string> = {
      'opd': 'General Physician',
      'emergency': 'Emergency Medicine', // Fallback
      'follow-up': 'General Physician'   // Fallback
    };

    // Actually, I just updated storage with specific specializations.
    // Let's use the provided specialization name if possible, or just filter all.
    return doctors.filter(d =>
      d.specialization.toLowerCase().includes(formData.appointmentType.toLowerCase()) ||
      (formData.appointmentType === 'opd' && d.specialization === 'General Physician')
    );
  }, [doctors, formData.appointmentType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name || !formData.phoneNumber || !formData.age || !formData.symptoms) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    const preferredTime = formData.preferredTime || new Date().toISOString();
    const targetDoctorId = selectedDoctorId;
    const allPatients = getPatients();
    const allDoctors = getDoctors();

    // 1️⃣ Duplicate Booking Prevention
    const isDuplicate = allPatients.some(p =>
      p.bookedDoctorId === targetDoctorId &&
      p.preferredTime === preferredTime &&
      p.status !== 'completed'
    );

    if (isDuplicate) {
      toast.error('This time slot is already booked for this doctor. Please choose another time.');
      setIsSubmitting(false);
      return;
    }

    // 2️⃣ Doctor Availability Handling
    const doctor = allDoctors.find(d => d.id === targetDoctorId);
    if (followUpEligible.isEligible && doctor && doctor.status !== 'available') {
      const nextTime = new Date();
      nextTime.setHours(nextTime.getHours() + 2); // Mock next available time
      const timeString = nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      toast.info(`Dr. ${doctor.name} is available at ${timeString}. Is it okay for you?`, {
        action: {
          label: 'Yes - Book',
          onClick: () => processBooking(true, targetDoctorId, preferredTime)
        },
        duration: 10000,
      });
      setIsSubmitting(false);
      return;
    }

    processBooking(false, targetDoctorId, preferredTime);
  };

  const processBooking = (isAutoRescheduled: boolean, doctorId: string, time: string) => {
    // Mock AI Analysis Delay
    setTimeout(() => {
      const urgencyLevel = predictUrgency(formData.symptoms);
      const estimatedTime = estimateConsultationTime(
        formData.symptoms,
        formData.appointmentType,
        urgencyLevel
      );

      const newPatient: Patient = {
        id: Date.now().toString(),
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        age: parseInt(formData.age),
        symptoms: formData.symptoms,
        appointmentType: formData.appointmentType,
        preferredTime: time,
        registrationTime: new Date().toISOString(),
        urgencyLevel,
        priorityScore: 0,
        estimatedConsultationTime: estimatedTime,
        status: 'waiting',
        queuePosition: 0,
        assignedDoctor: doctorId || undefined,
        bookedDoctorId: doctorId || undefined,
        isFollowUp: followUpEligible.isEligible
      };

      newPatient.priorityScore = calculatePriorityScore(newPatient);
      savePatient(newPatient);

      const allPatients = getPatients();
      const optimizedQueue = optimizeQueue(allPatients);
      updatePatients([
        ...optimizedQueue,
        ...allPatients.filter(p => p.status !== 'waiting')
      ]);

      const updatedPatient = optimizedQueue.find(p => p.id === newPatient.id);

      toast.success(
        `Registration successful! You are #${updatedPatient?.queuePosition} in queue`,
        {
          description: urgencyLevel === 'critical'
            ? 'URGENT: Emergency priority assigned'
            : 'Medical assessment complete'
        }
      );

      if (updatedPatient) {
        // Simulated SMS/WhatsApp Confirmation
        sendSMS(
          updatedPatient.phoneNumber,
          `Confirming your ${updatedPatient.isFollowUp ? 'Follow-up' : 'New'} appointment with Dr. ${updatedPatient.assignedDoctor} at ${new Date(updatedPatient.preferredTime).toLocaleString()}. Status: ${updatedPatient.status.toUpperCase()}`
        );
        setActivePatient(updatedPatient);
        setCurrentPatient(updatedPatient);
      }

      setFormData({
        name: '',
        phoneNumber: '',
        age: '',
        symptoms: '',
        appointmentType: 'opd',
        preferredTime: ''
      });

      setIsSubmitting(false);
      setTimeout(() => navigate('/queue'), 2500);
    }, 1500);
  };

  return (
    <div className="min-h-screen py-12 px-4 relative">
      <div className="max-w-5xl mx-auto relative z-10">

        {/* Futuristic Hero Section */}
        <section className="grid lg:grid-cols-2 gap-12 items-center mb-24 pt-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-sm font-bold mb-6">
              <Zap size={14} className="animate-pulse" />
              <span>MEDSPEAR</span>
            </div>
            <h1 className="text-7xl font-black tracking-tight text-slate-900 leading-[1.1] mb-6">
              Medspear
            </h1>
            <p className="text-xl text-slate-500 font-medium mb-8 leading-relaxed max-w-lg">
              A premium AI-powered patient registration system designed for instant assessment, autonomous prioritizing, and zero-latency care.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/queue')}
                className="bg-white text-blue-600 border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-50 px-8 py-7 rounded-2xl shadow-xl shadow-blue-100 transition-all duration-300"
              >
                <Clock className="mr-2 h-5 w-5" />
                Live Queue
              </Button>
              {followUpEligible.isEligible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Button
                    size="lg"
                    onClick={() => {
                      const element = document.getElementById('registration-card');
                      element?.scrollIntoView({ behavior: 'smooth' });
                      toast.success('Priority Access Granted!', {
                        description: 'Your details match our records for priority direct appointment.'
                      });
                    }}
                    className="bg-emerald-500 text-white hover:bg-emerald-600 px-8 py-7 rounded-2xl shadow-xl shadow-emerald-100 border-2 border-emerald-400 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
                    <Zap className="mr-2 h-5 w-5 animate-pulse" />
                    Priority Direct Appointment
                  </Button>
                </motion.div>
              )}
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate('/staff-login')}
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 py-7 px-8 rounded-2xl border-2 border-transparent hover:border-blue-100"
              >
                <Shield className="mr-2 h-5 w-5" />
                Staff Login
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative h-[400px] lg:h-[500px]"
          >
            <div className="absolute inset-0 bg-blue-400/10 blur-[100px] rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[300px] h-[300px] lg:w-[400px] lg:h-[400px]">
                <Canvas>
                  <ambientLight intensity={1} />
                  <pointLight position={[10, 10, 10]} />
                  <MedicalAIOrb />
                </Canvas>
              </div>
            </div>
            {/* Floating holographic stats */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-10 right-10 p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">System Load</p>
                  <p className="text-lg font-black text-slate-800 tracking-tight">OPTIMIZED</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Registration Card */}
        <motion.div
          id="registration-card"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-3xl mx-auto"
        >
          {/* Decorative Floating Icons */}
          <div className="absolute -left-20 top-20 text-blue-200 opacity-20 hidden xl:block">
            <Stethoscope size={120} className="rotate-[-20deg]" />
          </div>
          <div className="absolute -right-24 bottom-10 text-teal-200 opacity-20 hidden xl:block">
            <Heart size={140} className="rotate-[15deg]" />
          </div>

          <Card className="shadow-[0_32px_120px_-20px_rgba(0,0,0,0.1)] border-white/40 bg-white/30 backdrop-blur-3xl rounded-[40px] p-2 md:p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 text-blue-500/5">
              <Search size={200} />
            </div>

            <CardHeader className="text-center pb-8 border-b border-white/20 mb-8">
              <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">
                Medspear
              </CardTitle>
              <CardDescription className="text-lg text-slate-500 font-medium">
                Initial medical assessment protocol for queue placement
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-slate-800 font-bold ml-1 text-sm uppercase tracking-wider">Patient Identity</Label>
                    <div className="relative group">
                      <Input
                        id="name"
                        placeholder="What is your full name?"
                        className="h-14 px-5 bg-white/40 border-white/50 focus:bg-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 rounded-[20px] transition-all duration-300 placeholder:text-slate-400"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                      <div className="absolute bottom-0 left-5 right-5 h-[2px] bg-blue-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="phoneNumber" className="text-slate-800 font-bold ml-1 text-sm uppercase tracking-wider">Secure Contact</Label>
                    <div className="relative group">
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="Active phone number"
                        className="h-14 px-5 bg-white/40 border-white/50 focus:bg-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 rounded-[20px] transition-all duration-300 placeholder:text-slate-400"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        required
                      />
                      <div className="absolute bottom-0 left-5 right-5 h-[2px] bg-blue-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="age" className="text-slate-800 font-bold ml-1 text-sm uppercase tracking-wider">Biological Age</Label>
                  <div className="relative group">
                    <Input
                      id="age"
                      type="number"
                      placeholder="Current age in years"
                      className="h-14 px-5 bg-white/40 border-white/50 focus:bg-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 rounded-[20px] transition-all duration-300 placeholder:text-slate-400"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      min="0"
                      max="150"
                      required
                    />
                    <div className="absolute bottom-0 left-5 right-5 h-[2px] bg-blue-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end mb-1">
                    <Label htmlFor="symptoms" className="text-slate-800 font-bold ml-1 text-sm uppercase tracking-wider">Clinical Presentation</Label>
                    <span className="text-[10px] text-blue-500 font-black tracking-widest uppercase mb-1">AI Assessed</span>
                  </div>
                  <div className="relative group">
                    <Textarea
                      id="symptoms"
                      placeholder="Please describe your current medical condition with as much detail as possible..."
                      className="min-h-[140px] px-5 py-4 bg-white/40 border-white/50 focus:bg-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 rounded-[24px] transition-all duration-300 placeholder:text-slate-400 resize-none"
                      value={formData.symptoms}
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                      required
                    />
                    <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-blue-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/5 text-[11px] text-blue-600 font-black tracking-tight border border-blue-500/10">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    <span>AURA NEURAL ENGINE READY FOR TRIAGE ANALYSIS</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-slate-800 font-bold ml-1 text-sm uppercase tracking-wider">Medical Department</Label>
                    <Select
                      value={formData.appointmentType}
                      onValueChange={(value: 'opd' | 'emergency' | 'follow-up') =>
                        setFormData({ ...formData, appointmentType: value })
                      }
                    >
                      <SelectTrigger className="h-14 px-5 bg-white/40 border-white/50 rounded-[20px] focus:ring-4 focus:ring-blue-400/10 hover:border-blue-300 transition-all font-medium text-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-[20px] bg-white/90 backdrop-blur-xl border-white/50 shadow-2xl">
                        <SelectItem value="opd">General Physician</SelectItem>
                        <SelectItem value="Gynecologist">Gynecologist</SelectItem>
                        <SelectItem value="Dentist">Dentist</SelectItem>
                        <SelectItem value="Orthopedic">Orthopedic</SelectItem>
                        <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                        <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                        <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                        <SelectItem value="ENT">ENT</SelectItem>
                        <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                        <SelectItem value="emergency">Emergency Medicine</SelectItem>
                        <SelectItem value="follow-up">Follow-up Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-slate-800 font-bold ml-1 text-sm uppercase tracking-wider">Select Specialist</Label>
                    <Select
                      value={selectedDoctorId}
                      onValueChange={setSelectedDoctorId}
                    >
                      <SelectTrigger className="h-14 px-5 bg-white/40 border-white/50 rounded-[20px] focus:ring-4 focus:ring-blue-400/10 hover:border-blue-300 transition-all font-medium text-slate-700">
                        <SelectValue placeholder="Choose a Doctor" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[20px] bg-white/90 backdrop-blur-xl border-white/50 shadow-2xl">
                        {departmentDoctors.length > 0 ? (
                          departmentDoctors.map(doctor => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} ({doctor.status})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No specialists found for this dept</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="preferredTime" className="text-slate-800 font-bold ml-1 text-sm uppercase tracking-wider">Arrival Schedule</Label>
                    <Input
                      id="preferredTime"
                      type="datetime-local"
                      className="h-14 px-5 bg-white/40 border-white/50 rounded-[20px] focus:ring-4 focus:ring-blue-400/10 transition-all"
                      value={formData.preferredTime}
                      onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    />
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  {/* Primary Register Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-16 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-black rounded-3xl shadow-[0_20px_50px_-10px_rgba(37,99,235,0.5)] transition-all duration-300 flex items-center justify-center gap-3 tracking-wide"
                  >
                    {isSubmitting ? (
                      <Activity className="animate-spin h-6 w-6" />
                    ) : (
                      <>
                        <User className="h-5 w-5" />
                        <span>REGISTER PATIENT</span>
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      onClick={() => setBookingMethod('chat')}
                      className="h-16 bg-blue-600 text-white hover:bg-blue-700 text-lg font-black rounded-3xl shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] transition-all duration-300 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? (
                        <Activity className="animate-spin h-6 w-6" />
                      ) : (
                        <>
                          <MessageSquare className="h-5 w-5" />
                          <span>BOOK VIA CHAT</span>
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!formData.phoneNumber) {
                          toast.error('Please enter your phone number first');
                          return;
                        }
                        toast.success('Direct call connection established', {
                          description: 'A Medspear agent will connect you with the doctor shortly.'
                        });
                      }}
                      className="h-16 bg-emerald-600 text-white hover:bg-emerald-700 text-lg font-black rounded-3xl shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] transition-all duration-300 flex items-center justify-center gap-3"
                    >
                      <Phone className="h-5 w-5" />
                      <span>BOOK VIA CALL</span>
                    </Button>
                  </div>
                  <div className="absolute inset-0 rounded-3xl bg-blue-400/20 blur pointer-events-none -z-10 group-hover:blur-xl transition-all" />
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {activePatient && (
        <ChatWidget
          patientId={activePatient.id}
          patientName={activePatient.name}
          doctorId={activePatient.assignedDoctor}
          initialOpen={bookingMethod === 'chat'}
        />
      )}
    </div>
  );
}
