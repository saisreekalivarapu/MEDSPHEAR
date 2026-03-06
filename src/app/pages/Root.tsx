import { Outlet, useLocation } from "react-router";
import { Scene3D } from "../components/3d/Scene3D";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { MedicalAIOrb } from "../components/3d/MedicalAIOrb";
import { CustomCursor } from "../components/ui/CustomCursor";

export function Root() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen">
      <CustomCursor />
      <Scene3D />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="relative z-10"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      {/* Global AI Assistant Orb */}
      <div className="fixed bottom-8 right-8 z-[100] w-24 h-24 pointer-events-auto">
        <Canvas>
          <ambientLight intensity={1} />
          <pointLight position={[10, 10, 10]} />
          <MedicalAIOrb />
        </Canvas>
      </div>
    </div>
  );
}
