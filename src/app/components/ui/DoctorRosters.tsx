import * as React from 'react';
import { useState, useMemo } from 'react';
import { Search, User, Phone, Calendar, Heart, GraduationCap, Award, Languages, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent } from './card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from './accordion';
import { Doctor } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';

interface DoctorRostersProps {
    doctors: Doctor[];
    onToggleStatus?: (doctorId: string) => void;
}

export function DoctorRosters({ doctors, onToggleStatus }: DoctorRostersProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

    const groupedDoctors = useMemo(() => {
        const filtered = doctors.filter(doctor =>
            doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.reduce((acc, doctor) => {
            const dept = doctor.specialization;
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(doctor);
            return acc;
        }, {} as Record<string, Doctor[]>);
    }, [doctors, searchTerm]);

    const departments = Object.keys(groupedDoctors).sort();

    return (
        <div className="space-y-8">
            {/* Search Header */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/40 backdrop-blur-xl p-6 rounded-[32px] border border-white/50 shadow-xl shadow-blue-500/5">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                        placeholder="Search doctors by name or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 pl-12 pr-4 bg-white/60 border-white/40 focus:bg-white focus:border-blue-400 rounded-2xl transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-200 py-1.5 px-4 rounded-full font-black text-[10px] uppercase tracking-widest">
                        {doctors.length} Total Specialists
                    </Badge>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Accordion List */}
                <div className="lg:col-span-8">
                    <Accordion type="single" collapsible className="space-y-4">
                        {departments.map((dept, index) => (
                            <AccordionItem
                                key={dept}
                                value={dept}
                                className="border-none bg-white/40 backdrop-blur-xl rounded-[32px] overflow-hidden border border-white/30 shadow-lg shadow-blue-500/5"
                            >
                                <AccordionTrigger className="px-8 py-6 hover:no-underline hover:bg-white/40 transition-all data-[state=open]:bg-blue-600/5 data-[state=open]:border-b data-[state=open]:border-blue-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                                            <Heart size={20} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">{dept}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                {groupedDoctors[dept].length} Specialists Available
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {groupedDoctors[dept].map((doctor) => (
                                            <motion.div
                                                key={doctor.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedDoctor(doctor)}
                                            >
                                                <Card className={cn(
                                                    "cursor-pointer border-white/40 bg-white/60 hover:bg-white hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 rounded-2xl overflow-hidden group",
                                                    selectedDoctor?.id === doctor.id && "ring-2 ring-blue-500 bg-white shadow-2xl"
                                                )}>
                                                    <CardContent className="p-4 flex items-center gap-4">
                                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 border border-white group-hover:from-blue-50 group-hover:to-blue-100 transition-colors">
                                                            <User size={28} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-black text-slate-800 truncate leading-tight">{doctor.name}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={cn(
                                                                    "w-2 h-2 rounded-full animate-pulse",
                                                                    doctor.status === 'available' ? "bg-emerald-500" : "bg-slate-300"
                                                                )} />
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                    {doctor.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                {/* Profile Detail Side / Modal Alternative */}
                <div className="lg:col-span-4">
                    <AnimatePresence mode="wait">
                        {selectedDoctor ? (
                            <motion.div
                                key={selectedDoctor.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="sticky top-8 rounded-[40px] bg-white shadow-2xl border border-slate-100 overflow-hidden"
                            >
                                <div className="h-32 bg-gradient-to-br from-blue-600 to-cyan-500 relative">
                                    <div className="absolute -bottom-12 left-8 p-1 rounded-[32px] bg-white shadow-xl">
                                        <div className="w-24 h-24 rounded-[28px] bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-50">
                                            <User size={48} />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 pt-16">
                                    <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 mb-4">
                                        {selectedDoctor.specialization}
                                    </Badge>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{selectedDoctor.name}</h2>
                                    <p className="text-slate-500 font-medium mb-8">Senior Medical Associate • Medspear Health</p>

                                    <div className="space-y-6 mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <GraduationCap size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Education</p>
                                                <p className="text-sm font-bold text-slate-700">MD • AIIMS New Delhi</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Award size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Experience</p>
                                                <p className="text-sm font-bold text-slate-700">15+ Years Clinical Research</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Languages size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Languages</p>
                                                <p className="text-sm font-bold text-slate-700">English, Hindi, Bengali</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {onToggleStatus && (
                                            <Button
                                                onClick={() => {
                                                    onToggleStatus(selectedDoctor.id);
                                                    if (selectedDoctor.status === 'available') {
                                                        toast.error('EMERGENCY MODE ACTIVATED', {
                                                            description: 'Replacement logic triggered. Check dashboard alerts.',
                                                            duration: 5000
                                                        });
                                                    }
                                                }}
                                                className={cn(
                                                    "h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all",
                                                    selectedDoctor.status === 'available'
                                                        ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
                                                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                                                )}
                                            >
                                                <Activity className="mr-2 h-4 w-4 animate-pulse" />
                                                {selectedDoctor.status === 'available' ? 'Simulate Emergency' : 'Restore Service'}
                                            </Button>
                                        )}
                                        <Button className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Book Consultation
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-[500px] flex flex-col items-center justify-center text-center opacity-30 border border-dashed border-slate-300 rounded-[40px]">
                                <User size={48} className="mb-4" />
                                <h4 className="font-bold text-slate-500">Select a Specialist</h4>
                                <p className="text-sm text-slate-400 max-w-[200px] mx-auto">Click on a doctor to view their clinical profile and availability</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
