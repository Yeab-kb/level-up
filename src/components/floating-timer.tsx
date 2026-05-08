import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useTimer, formatTime } from "@/lib/timer-context";
import { useAuth } from "@/lib/auth-context";

export function FloatingTimer() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { running, remainingMs, mode, progress, toggle } = useTimer();

  const visible = !!user && running && path !== "/timer";
  const C = 2 * Math.PI * 18;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6"
        >
          <div className="glass flex items-center gap-3 rounded-full p-1.5 pr-4 shadow-glow">
            <button
              onClick={toggle}
              className="relative grid h-11 w-11 place-items-center rounded-full gradient-primary text-primary-foreground"
              aria-label={running ? "Pause timer" : "Resume timer"}
            >
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <circle
                  cx="22" cy="22" r="18" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C - progress * C}
                />
              </svg>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
            </button>
            <Link to="/timer" className="flex flex-col leading-none">
              <span className="font-display text-base font-bold tabular-nums">{formatTime(remainingMs)}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{mode}</span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
