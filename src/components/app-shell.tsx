import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LayoutDashboard, ListTodo, Calendar, Timer, NotebookPen, BarChart3, Settings, Sparkles, LogOut, Sun, Moon, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/data-hooks";
import { useTheme } from "@/lib/theme-context";
import { toast } from "sonner";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/timer", label: "Timer", icon: Timer },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { theme, toggle } = useTheme();
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initial = (displayName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold">Level Up</span>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group relative my-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl gradient-primary shadow-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon className={`relative h-4.5 w-4.5 ${active ? "text-primary-foreground" : ""}`} />
              <span className={`relative ${active ? "text-primary-foreground" : ""}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={toggle}
          className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/60 px-3 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
            {(user?.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user?.user_metadata?.full_name ?? user?.email?.split("@")[0]}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={async () => { await signOut(); toast.success("Logged out"); }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = navItems.slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-background/80 px-2 py-2 backdrop-blur-xl md:hidden">
      {items.map((item) => {
        const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
        return (
          <Link key={item.to} to={item.to} className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium">
            <span className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${active ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}>
              <item.icon className="h-4.5 w-4.5" />
            </span>
            <span className={active ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileHeader() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/70 px-4 py-3 backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold">Level Up</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={toggle} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button onClick={async () => { await signOut(); toast.success("Logged out"); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
          <LogOut className="h-4 w-4" />
        </button>
        <div className="ml-1 grid h-8 w-8 place-items-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
          {(user?.email?.[0] ?? "?").toUpperCase()}
        </div>
      </div>
    </header>
  );
}
