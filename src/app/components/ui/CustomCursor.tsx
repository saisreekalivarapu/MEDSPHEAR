import * as React from 'react';
import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export function CustomCursor() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 700 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    const [isClicking, setIsClicking] = useState(false);
    const [isHoveringLink, setIsHoveringLink] = useState(false);
    const [isHoveringHealth, setIsHoveringHealth] = useState(false);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            setIsHoveringLink(!!target.closest('button, a, [role="button"]'));
            setIsHoveringHealth(!!target.closest('.health-element'));
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [cursorX, cursorY]);

    return (
        <>
            <motion.div
                className="fixed top-0 left-0 w-9 h-9 pointer-events-none z-[9999] rounded-full border-[3px] border-slate-900 bg-white/20 backdrop-blur-sm"
                style={{
                    translateX: cursorXSpring,
                    translateY: cursorYSpring,
                    x: '-50%',
                    y: '-50%',
                }}
                animate={{
                    scale: isClicking ? 2 : isHoveringLink ? 1.5 : 1,
                    opacity: isClicking ? 0 : 1,
                    borderWidth: isClicking ? 1 : 3,
                }}
            />
            <motion.div
                className="fixed top-0 left-0 w-3 h-3 pointer-events-none z-[9999] rounded-full bg-blue-600 shadow-[0_0_0_2px_white,0_0_15px_rgba(37,99,235,0.9)]"
                style={{
                    translateX: cursorX,
                    translateY: cursorY,
                    x: '-50%',
                    y: '-50%',
                }}
                animate={{
                    scale: isClicking ? 2.5 : 1,
                    backgroundColor: isHoveringHealth ? '#ef4444' : '#3b82f6',
                    boxShadow: isHoveringHealth
                        ? '0 0 20px rgba(239,68,68,1)'
                        : '0 0 15px rgba(59,130,246,0.8)'
                }}
            >
                {isHoveringHealth && (
                    <motion.div
                        className="absolute inset-0 bg-red-400 rounded-full"
                        animate={{
                            scale: [1, 3, 1],
                            opacity: [0.5, 0, 0.5]
                        }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                    />
                )}
            </motion.div>
        </>
    );
}
