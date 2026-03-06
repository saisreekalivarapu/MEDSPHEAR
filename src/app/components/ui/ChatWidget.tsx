import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, User, Activity, Bot, CheckCircle2, XCircle, Stethoscope, Calendar } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { chatService } from '../../utils/chatService';
import { ChatMessage } from '../../types';
import { cn } from './utils';
import { getPatients, updatePatients, getDoctors, saveReplacementEvent, getReplacementLog } from '../../utils/storage';
import { updateReplacementEventStatus } from '../../utils/doctorReplacementService';
import { toast } from 'sonner';

interface ChatWidgetProps {
    patientId: string;
    patientName: string;
    doctorId?: string;
    initialOpen?: boolean;
}

export function ChatWidget({ patientId, patientName, doctorId, initialOpen = false }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [respondedProposals, setRespondedProposals] = useState<Set<string>>(new Set());
    const [declinedProposalId, setDeclinedProposalId] = useState<string | null>(null);
    const [manualDoctors, setManualDoctors] = useState<{ id: string; name: string; specialization: string }[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [newDate, setNewDate] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages(chatService.getMessages(patientId));
        const unsubscribe = chatService.subscribe((allMessages) => {
            setMessages(allMessages.filter(m => m.patientId === patientId));
        });
        return unsubscribe;
    }, [patientId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        chatService.sendMessage(patientId, message, 'patient', doctorId);
        setMessage('');
    };

    // ─── Replacement Consent Handlers ─────────────────────────────────────────

    const handleAcceptReplacement = (msg: ChatMessage) => {
        if (!msg.replacementDoctorId) return;

        const patients = getPatients();
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        const updatedPatients = patients.map(p =>
            p.id === patientId
                ? { ...p, assignedDoctor: msg.replacementDoctorId, replacementStatus: 'accepted' as const }
                : p
        );
        updatePatients(updatedPatients);

        // Update audit log
        updateReplacementEventStatus(patientId, 'accepted', 'Patient accepted via chat');

        // Mark proposal as responded
        setRespondedProposals(prev => new Set([...prev, msg.id]));

        // Reload available doctors for possible future use
        chatService.sendMessage(
            patientId,
            `✅ Thank you! Your appointment has been confirmed with the replacement doctor. You will receive further details shortly.`,
            'system'
        );

        toast.success('Replacement accepted! Appointment updated.');
    };

    const handleDeclineReplacement = (msg: ChatMessage) => {
        if (!msg.replacementDoctorId) return;

        const patients = getPatients();
        const updatedPatients = patients.map(p =>
            p.id === patientId
                ? { ...p, replacementStatus: 'declined' as const }
                : p
        );
        updatePatients(updatedPatients);

        updateReplacementEventStatus(patientId, 'declined', 'Patient declined via chat');

        setRespondedProposals(prev => new Set([...prev, msg.id]));
        setDeclinedProposalId(msg.id);

        chatService.sendMessage(
            patientId,
            `❌ You have declined the proposed replacement. Please choose one of the options below to reschedule or pick another doctor.`,
            'system'
        );

        // Load available doctors in same specialization for manual pick
        const originalDoctorId = patients.find(p => p.id === patientId)?.bookedDoctorId
            || patients.find(p => p.id === patientId)?.assignedDoctor;
        const allDoctors = getDoctors();
        const origDoctor = originalDoctorId ? allDoctors.find(d => d.id === originalDoctorId) : null;
        const available = allDoctors.filter(
            d => d.status === 'available' && (!origDoctor || d.specialization === origDoctor.specialization) && d.id !== msg.replacementDoctorId
        );
        setManualDoctors(available);
    };

    const handleManualDoctorSelect = (selectedDoc: { id: string; name: string }) => {
        const patients = getPatients();
        const updatedPatients = patients.map(p =>
            p.id === patientId
                ? { ...p, assignedDoctor: selectedDoc.id, replacementStatus: 'manual' as const }
                : p
        );
        updatePatients(updatedPatients);
        updateReplacementEventStatus(patientId, 'manual', `Patient manually chose ${selectedDoc.name}`);

        setDeclinedProposalId(null);
        setManualDoctors([]);
        chatService.sendMessage(
            patientId,
            `✅ Great! You have selected ${selectedDoc.name}. Your appointment is confirmed with the new doctor.`,
            'system'
        );
        toast.success(`Appointment confirmed with ${selectedDoc.name}`);
    };

    const handleNewDateSubmit = () => {
        if (!newDate) return;
        const patients = getPatients();
        const updatedPatients = patients.map(p =>
            p.id === patientId
                ? { ...p, preferredTime: new Date(newDate).toISOString(), replacementStatus: 'manual' as const }
                : p
        );
        updatePatients(updatedPatients);
        updateReplacementEventStatus(patientId, 'manual', `Patient chose new date: ${newDate}`);

        setDeclinedProposalId(null);
        setShowDatePicker(false);
        setNewDate('');
        chatService.sendMessage(
            patientId,
            `📅 Your appointment has been rescheduled to ${new Date(newDate).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. Our team will confirm this slot shortly.`,
            'system'
        );
        toast.success('Appointment rescheduled!');
    };

    return (
        <div className="fixed bottom-10 left-10 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="mb-4 w-96 max-h-[600px] flex flex-col rounded-[32px] bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl overflow-hidden shadow-blue-200/50"
                    >
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                    <Activity className="h-5 w-5 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-black tracking-tight text-white leading-tight">Medspear Care</h3>
                                    <p className="text-[10px] font-bold text-blue-50 uppercase tracking-widest opacity-80">Connected Nexus</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/20 rounded-xl"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px] custom-scrollbar"
                        >
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-10">
                                    <Bot className="h-12 w-12 mb-2" />
                                    <p className="text-sm font-bold text-slate-500">How can we assist you today?</p>
                                </div>
                            )}
                            {messages.map((msg) => {
                                const isProposal = msg.messageType === 'replacement_proposal';
                                const alreadyResponded = respondedProposals.has(msg.id);

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, x: msg.sender === 'patient' ? 10 : -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "flex flex-col max-w-[95%]",
                                            msg.sender === 'patient' ? "ml-auto items-end" : "items-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm",
                                            msg.sender === 'patient'
                                                ? "bg-blue-600 text-white rounded-br-none"
                                                : msg.sender === 'system'
                                                    ? isProposal
                                                        ? "bg-amber-50 text-slate-700 rounded-bl-none border border-amber-200 w-full"
                                                        : "bg-slate-100 text-slate-600 rounded-bl-none border border-slate-200"
                                                    : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
                                        )}>
                                            {/* Proposal header badge */}
                                            {isProposal && (
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-200">
                                                    <Stethoscope className="h-4 w-4 text-amber-600" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Replacement Proposal</span>
                                                </div>
                                            )}
                                            {/* Message text (with whitespace preserved for multi-line) */}
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                                            {/* Accept / Decline buttons for fresh proposals */}
                                            {isProposal && !alreadyResponded && (
                                                <div className="flex gap-2 mt-3 pt-2 border-t border-amber-200">
                                                    <button
                                                        onClick={() => handleAcceptReplacement(msg)}
                                                        className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineReplacement(msg)}
                                                        className="flex-1 h-9 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                            {isProposal && alreadyResponded && (
                                                <div className="mt-2 pt-2 border-t border-amber-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    Response recorded
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            {msg.sender === 'system' ? 'System Notification' : msg.sender === 'patient' ? 'You' : 'Care Team'}
                                        </span>
                                    </motion.div>
                                );
                            })}

                            {/* Post-decline manual options panel */}
                            {declinedProposalId && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3"
                                >
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Choose an option:</p>

                                    {/* Choose another doctor */}
                                    {manualDoctors.length > 0 && !showDatePicker && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-slate-600">Select another available doctor:</p>
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                                                {manualDoctors.map(d => (
                                                    <button
                                                        key={d.id}
                                                        onClick={() => handleManualDoctorSelect(d)}
                                                        className="w-full text-left px-3 py-2 rounded-xl bg-white border border-blue-100 hover:border-blue-400 hover:bg-blue-50 transition text-xs font-bold text-slate-700 flex items-center gap-2"
                                                    >
                                                        <Stethoscope className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                        <span>{d.name}</span>
                                                        <span className="ml-auto text-[10px] text-slate-400 font-medium">{d.specialization}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-px bg-blue-100" />
                                        <span className="text-[10px] text-slate-400 font-bold">OR</span>
                                        <div className="flex-1 h-px bg-blue-100" />
                                    </div>

                                    {/* Pick new date */}
                                    {!showDatePicker ? (
                                        <button
                                            onClick={() => setShowDatePicker(true)}
                                            className="w-full h-9 bg-white border border-blue-200 hover:border-blue-400 rounded-xl text-xs font-black text-blue-600 flex items-center justify-center gap-2 transition"
                                        >
                                            <Calendar className="h-3.5 w-3.5" />
                                            Schedule New Date & Time
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                type="datetime-local"
                                                value={newDate}
                                                onChange={e => setNewDate(e.target.value)}
                                                className="w-full h-9 px-3 text-xs border border-blue-200 rounded-xl bg-white focus:outline-none focus:border-blue-400"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleNewDateSubmit}
                                                    disabled={!newDate}
                                                    className="flex-1 h-8 bg-blue-600 text-white text-xs font-black rounded-xl disabled:opacity-40"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => setShowDatePicker(false)}
                                                    className="flex-1 h-8 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl"
                                                >
                                                    Back
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white/50 flex gap-2">
                            <Input
                                placeholder="Secure message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="rounded-2xl border-slate-200 focus:border-blue-400 bg-white/50"
                            />
                            <Button type="submit" size="icon" className="rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 shrink-0">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="h-16 w-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-blue-300 relative group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
                {!isOpen && messages.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                        {messages.length}
                    </div>
                )}
            </motion.button>
        </div>
    );
}
