import * as React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Users,
    UserSquare2,
    History,
    Settings,
    LogOut,
    LayoutDashboard,
    ShieldCheck
} from 'lucide-react';

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    active?: boolean;
}

function SidebarItem({ icon: Icon, label, active }: SidebarItemProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${active
                ? 'bg-blue-600/10 text-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.1)] border border-blue-200/50'
                : 'text-slate-500 hover:text-blue-500 hover:bg-blue-50/50'
                }`}
        >
            <Icon className="h-5 w-5" />
            <span className="font-bold text-sm tracking-tight">{label}</span>
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                />
            )}
        </motion.div>
    );
}

export function AdminSidebar({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) {
    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-white/40 backdrop-blur-2xl border-r border-white/30 p-6 flex flex-col z-50 overflow-hidden"
        >
            {/* Brand */}
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                    <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tighter leading-none">Medspear</h2>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 block">Staff Portal</span>
                </div>
            </div>

            {/* Nav Items */}
            <div className="space-y-2 flex-1">
                <div onClick={() => onTabChange('queue')}>
                    <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === 'queue'} />
                </div>
                <div onClick={() => onTabChange('history')}>
                    <SidebarItem icon={BarChart3} label="Live Analytics" active={activeTab === 'history'} />
                </div>
                <div onClick={() => onTabChange('queue')}>
                    <SidebarItem icon={Users} label="Patient Queue" active={activeTab === 'queue'} />
                </div>
                <div onClick={() => onTabChange('doctors')}>
                    <SidebarItem icon={UserSquare2} label="Doctor Rosters" active={activeTab === 'doctors'} />
                </div>
                <div onClick={() => onTabChange('history')}>
                    <SidebarItem icon={History} label="Medical History" active={activeTab === 'history'} />
                </div>

                <div className="pt-8 mb-4">
                    <span className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">System</span>
                </div>
                <div onClick={() => onTabChange('doctors-master')}>
                    <SidebarItem icon={Settings} label="Doctor Master" active={activeTab === 'doctors-master'} />
                </div>
                <SidebarItem icon={Settings} label="Governance" />
            </div>

            {/* User Session */}
            <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-xs font-black text-blue-600">JD</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">Dr. John Doe</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase truncate">Chief Medical Officer</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-3 text-red-500 font-bold text-sm bg-red-50/50 rounded-2xl hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Terminate Session
                </motion.button>
            </div>

            {/* Background Decorative */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100/30 rounded-full blur-3xl -z-10" />
        </motion.aside>
    );
}
