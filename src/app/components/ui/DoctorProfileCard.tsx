import * as React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Doctor } from '../../types';
import { Badge } from './badge';
import { User, Activity } from 'lucide-react';

interface DoctorProfileCardProps {
    doctor: Doctor;
    onToggleStatus: (id: string) => void;
}

export function DoctorProfileCard({ doctor, onToggleStatus }: DoctorProfileCardProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [15, -15]);
    const rotateY = useTransform(x, [-100, 100], [-15, 15]);

    function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(event.clientX - centerX);
        y.set(event.clientY - centerY);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            style={{ perspective: 1000 }}
            onMouseMove={handleMouse}
            onMouseLeave={handleMouseLeave}
            className="relative group h-full"
        >
            <motion.div
                style={{ rotateX, rotateY }}
                className="bg-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl hover:shadow-blue-200/50 transition-shadow duration-500 overflow-hidden h-full"
            >
                <div className="absolute top-0 right-0 p-4">
                    <Badge
                        className={`animate-pulse shadow-sm ${doctor.status === 'available'
                            ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-600 border-red-500/30'
                            }`}
                    >
                        {doctor.status}
                    </Badge>
                </div>

                <div className="flex flex-col items-center text-center mt-4">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-50 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden relative z-10">
                            <User className="h-12 w-12 text-blue-600" />
                        </div>
                        <motion.div
                            className="absolute -inset-2 bg-blue-400/20 rounded-full blur-xl z-0"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                        />
                    </div>

                    <h4 className="text-xl font-black text-slate-800 tracking-tight mb-1">{doctor.name}</h4>
                    <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-4 opacity-80">{doctor.specialization}</p>

                    <div className="grid grid-cols-2 gap-4 w-full mb-6">
                        <div className="bg-white/50 rounded-2xl p-3 border border-white/50">
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Patients Today</p>
                            <p className="text-lg font-bold text-slate-800">{doctor.patientsToday}</p>
                        </div>
                        <div className="bg-white/50 rounded-2xl p-3 border border-white/50">
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Avg Time</p>
                            <p className="text-lg font-bold text-slate-800">{doctor.averageConsultationTime}m</p>
                        </div>
                    </div>

                    <button
                        onClick={() => onToggleStatus(doctor.id)}
                        disabled={doctor.status === 'busy'}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group/btn"
                    >
                        <Activity className="h-4 w-4 group-hover/btn:animate-spin" />
                        {doctor.status === 'available' ? 'Set Offline' : 'Set Available'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
