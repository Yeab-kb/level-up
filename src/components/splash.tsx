import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export function Splash({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          style={{ backgroundImage: "var(--gradient-mesh)" }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid h-20 w-20 place-items-center rounded-3xl gradient-primary shadow-glow"
          >
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-6 font-display text-2xl font-bold tracking-tight"
          >
            Level Up
          </motion.p>
          <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full gradient-primary"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              style={{ width: "50%" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
