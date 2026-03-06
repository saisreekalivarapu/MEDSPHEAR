import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, Clock, Activity, Users, TrendingUp, Zap, Heart, Shield, RefreshCw, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartbeatWave } from '../components/ui/HeartbeatWave';
import { Patient, Doctor } from '../types';
import { getPatients, getDoctors, getCurrentPatient } from '../utils/storage';
import { ChatWidget } from '../components/ui/ChatWidget';
import { optimizeQueue, calculateExpectedWaitTime } from '../utils/aiEngine';
import { triggerEmergency } from '../utils/emergencyService';
import { toast } from 'sonner';

export function QueueDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [stats, setStats] = useState({
    totalWaiting: 0,
    criticalPatients: 0,
    averageWaitTime: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadQueue();
    setCurrentPatient(getCurrentPatient());
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = () => {
    setIsRefreshing(true);
    const allPatients = getPatients();
    const allDoctors = getDoctors();
    const availableDoctorsCount = allDoctors.filter(d => d.status === 'available').length;

    const optimized = optimizeQueue(allPatients);

    const withWaitTimes = optimized.map(patient => ({
      ...patient,
      expectedWaitTime: calculateExpectedWaitTime(patient, optimized, availableDoctorsCount)
    }));

    setPatients(withWaitTimes);
    setDoctors(allDoctors);

    const waiting = withWaitTimes.filter(p => p.status === 'waiting');
    const critical = waiting.filter(p => p.urgencyLevel === 'critical');
    const avgWait = waiting.length > 0
      ? Math.round(waiting.reduce((sum, p) => sum + (p.expectedWaitTime || 0), 0) / waiting.length)
      : 0;

    setStats({
      totalWaiting: waiting.length,
      criticalPatients: critical.length,
      averageWaitTime: avgWait
    });

    setTimeout(() => setIsRefreshing(false), 800);
  };

  const getUrgencyBadgeVariant = (level: string): "destructive" | "default" | "outline" => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'medium': return 'default';
      default: return 'outline';
    }
  };

  const handleEmergencyProtocol = () => {
    if (!currentPatient) {
      toast.error('Session Error', {
        description: 'Please complete triage first to activate emergency protocol.'
      });
      return;
    }

    if (currentPatient.emergencyStatus === 'active') {
      toast.info('Protocol Already Active', {
        description: 'Emergency clinical team is already processing your request.'
      });
      return;
    }

    const event = triggerEmergency(currentPatient.id);
    if (event) {
      toast.error('EMERGENCY PROTOCOL ACTIVATED', {
        description: 'Critical alert sent to command center. Please wait.',
        duration: 8000
      });
      loadQueue(); // Refresh to show critical status
      // Update local patient state
      setCurrentPatient(prev => prev ? { ...prev, emergencyStatus: 'active', urgencyLevel: 'critical' } : null);
    }
  };

  const waitingPatients = patients.filter(p => p.status === 'waiting');

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Futuristic Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/')}
              className="p-4 rounded-3xl bg-white/40 backdrop-blur-md border border-white/50 text-blue-600 shadow-xl"
            >
              <ArrowLeft size={24} />
            </motion.button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black tracking-[0.2em] text-emerald-600 uppercase">Live Operations</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI <span className="text-blue-600">Command</span> Center</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <HeartbeatWave />
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadQueue}
                disabled={isRefreshing}
                className="p-3 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </motion.button>
              <Button
                onClick={() => navigate('/staff-login')}
                className="bg-slate-900 text-white rounded-2xl px-6 h-12 shadow-xl hover:bg-blue-600 transition-all"
              >
                <Shield className="mr-2 h-4 w-4" />
                Medical Portal
              </Button>
            </div>
          </div>
        </header>

        {/* Global Statistics Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Triage', value: stats.totalWaiting, icon: Users, color: 'blue' },
            { label: 'Critical Alert', value: stats.criticalPatients, icon: Activity, color: 'red', pulse: stats.criticalPatients > 0 },
            { label: 'Avg Latency', value: `${stats.averageWaitTime}m`, icon: Clock, color: 'emerald' },
            { label: 'Efficiency', value: '98%', icon: Zap, color: 'amber' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-white/40 bg-white/30 backdrop-blur-xl rounded-[32px] overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                      <stat.icon size={24} />
                    </div>
                    {stat.pulse && (
                      <div className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-4xl font-black text-slate-900 tracking-tighter`}>{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Optimized Queue Section */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="text-blue-600" />
                Next-Gen Queue
              </h2>
              <Badge variant="outline" className="rounded-full bg-blue-50/50 text-blue-600 border-blue-200">
                AI OPTIMIZED
              </Badge>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {waitingPatients.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 rounded-[40px] bg-white/20 backdrop-blur-md border border-dashed border-white/50"
                  >
                    <div className="p-6 rounded-full bg-blue-50 text-blue-200 mb-6">
                      <Users size={48} />
                    </div>
                    <p className="text-xl font-bold text-slate-400">System Standing By</p>
                    <p className="text-sm text-slate-400 mb-8">No active triages detected in the ecosystem</p>
                    <Button onClick={() => navigate('/')} className="rounded-2xl bg-blue-600 px-8 py-6 h-auto">
                      Initiate Triage
                    </Button>
                  </motion.div>
                ) : (
                  waitingPatients.map((patient, i) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05 }}
                      layout
                    >
                      <Card className="border-white/50 bg-white/40 backdrop-blur-xl rounded-[32px] overflow-hidden hover:bg-white/60 transition-all duration-300 group shadow-lg hover:shadow-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center justify-center w-20 h-20 rounded-[24px] bg-slate-900 text-white shadow-xl">
                              <span className="text-[10px] font-black opacity-50 uppercase tracking-widest leading-none mb-1">POS</span>
                              <span className="text-3xl font-black leading-none">#{patient.queuePosition}</span>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{patient.name}</h3>
                                <Badge variant={getUrgencyBadgeVariant(patient.urgencyLevel)} className="rounded-lg px-2 py-0 text-[10px] font-black uppercase">
                                  {patient.urgencyLevel}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-500 font-medium">
                                  <Clock size={16} className="text-blue-500" />
                                  <span>Latency: <strong className="text-slate-900">{patient.expectedWaitTime}m</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 font-medium">
                                  <Activity size={16} className="text-emerald-500" />
                                  <span>Duration: <strong className="text-slate-900">{patient.estimatedConsultationTime}m</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                  <Zap size={10} />
                                  AI Score: {patient.priorityScore}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="flex -space-x-2">
                                {[1, 2, 3].map(j => (
                                  <div key={j} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                    AI
                                  </div>
                                ))}
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment Active</span>
                            </div>
                          </div>

                          <div className="mt-6 space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <span>Queue Progress</span>
                              <span>{Math.round(100 - (patient.queuePosition / patients.length * 100))}% Ahead</span>
                            </div>
                            <Progress
                              value={100 - (patient.queuePosition / patients.length * 100)}
                              className="h-1.5 bg-slate-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-teal-400 rounded-full"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="px-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Heart className="text-red-500 fill-red-500/10" />
                Clinical Staff
              </h2>
            </div>

            <div className="space-y-4">
              {doctors.map((doctor, i) => (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <Card className="border-white/50 bg-white/40 backdrop-blur-xl rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-white flex items-center justify-center text-slate-400">
                            <User size={28} />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${doctor.status === 'available' ? 'bg-emerald-500' : 'bg-slate-300'} animate-pulse`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">{doctor.specialization}</p>
                          <h4 className="text-lg font-black text-slate-900 leading-tight">Dr. {doctor.name.split(' ')[1]}</h4>
                        </div>
                        <Badge variant="outline" className={`rounded-full border-transparent ${doctor.status === 'available' ? 'bg-emerald-50/50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                          {doctor.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="border-blue-200/50 bg-blue-600 text-white rounded-[40px] p-8 shadow-2xl shadow-blue-500/20 overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <Zap size={200} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Need Urgent Help?</h3>
              <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6">
                Our emergency neural triage system handles life-critical situations with sub-second latency.
              </p>
              <Button
                onClick={handleEmergencyProtocol}
                className="w-full bg-white text-blue-600 hover:bg-blue-50 rounded-2xl h-14 font-black transition-all active:scale-95"
              >
                {currentPatient?.emergencyStatus === 'active' ? 'PROTOCOL ACTIVE...' : 'EMERGENCY PROTOCOL'}
              </Button>
            </Card>
          </div>
        </div>

        {/* System Heartbeat Wave */}
        <div className="mt-12 p-8 rounded-[40px] bg-white/10 backdrop-blur-md border border-white/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Global Ecosystem Pulse</p>
              <p className="text-sm font-bold text-slate-600">System performing within optimal tolerance levels.</p>
            </div>
          </div>
          <div className="flex-1 max-w-md h-12">
            <HeartbeatWave />
          </div>
        </div>
      </div>

      {currentPatient && (
        <ChatWidget
          patientId={currentPatient.id}
          patientName={currentPatient.name}
          doctorId={currentPatient.assignedDoctor}
        />
      )}
    </div>
  );
}
