import * as React from 'react';
import { motion } from 'framer-motion';

export function HeartbeatWave() {
    return (
        <div className="flex items-center gap-4 px-6 h-14 bg-white/40 backdrop-blur-xl rounded-[20px] border border-white/50 shadow-lg shadow-blue-500/5 group hover:bg-white/60 transition-all duration-300">
            <div className="relative w-32 h-10 overflow-hidden">
                <svg viewBox="0 0 100 20" className="w-full h-full drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]">
                    {/* Static background path */}
                    <path
                        d="M 0 10 L 20 10 L 25 2 L 30 18 L 35 10 L 100 10"
                        fill="transparent"
                        stroke="rgba(37, 99, 235, 0.1)"
                        strokeWidth="1.5"
                    />
                    {/* Animated path */}
                    <motion.path
                        d="M 0 10 L 20 10 L 25 2 L 30 18 L 35 10 L 100 10"
                        fill="transparent"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={{
                            pathLength: [0, 1, 0],
                            pathOffset: [0, 0, 1],
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: [0.42, 0, 0.58, 1],
                        }}
                    />
                </svg>
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] text-blue-600 font-black uppercase tracking-[0.2em] leading-none mb-1">Clinic Pulse</span>
                <span className="text-lg font-black text-slate-900 leading-none tracking-tighter group-hover:text-blue-600 transition-colors">72 <span className="text-[10px] opacity-40 uppercase ml-0.5">Bpm</span></span>
            </div>
        </div>
    );
}
