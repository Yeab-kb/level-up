import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { TimerProvider } from "@/lib/timer-context";
import { Splash } from "@/components/splash";
import { FloatingTimer } from "@/components/floating-timer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-10 text-center">
        <p className="gradient-text text-7xl font-extrabold">404</p>
        <h2 className="mt-3 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-5 rounded-full gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Level Up — Student Productivity" },
      { name: "description", content: "Level Up is a smart student productivity app: tasks, calendar, pomodoro, notes, and analytics in one beautiful workspace." },
      { name: "theme-color", content: "#0b1220" },
      { property: "og:title", content: "Level Up — Student Productivity" },
      { name: "twitter:title", content: "Level Up — Student Productivity" },
      { property: "og:description", content: "Level Up is a smart student productivity app: tasks, calendar, pomodoro, notes, and analytics in one beautiful workspace." },
      { name: "twitter:description", content: "Level Up is a smart student productivity app: tasks, calendar, pomodoro, notes, and analytics in one beautiful workspace." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/330a81dc-6ba5-4ee4-a3e5-26f3d4da2e70/id-preview-a7324fe7--c776c4ae-b4ae-4c53-b2d7-14a7a32097cd.lovable.app-1778267913044.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/330a81dc-6ba5-4ee4-a3e5-26f3d4da2e70/id-preview-a7324fe7--c776c4ae-b4ae-4c53-b2d7-14a7a32097cd.lovable.app-1778267913044.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TimerProvider>
            <SplashGate>
              <Outlet />
              <FloatingTimer />
            </SplashGate>
            <Toaster position="top-right" theme="system" richColors closeButton />
          </TimerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function SplashGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  // Keep splash for a minimum duration so it never flashes.
  const [minHold, setMinHold] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setMinHold(false), 600);
    return () => clearTimeout(t);
  }, []);
  const show = loading || minHold;
  return (
    <>
      <Splash show={show} />
      <div aria-hidden={show} style={show ? { visibility: "hidden" } : undefined}>
        {children}
      </div>
    </>
  );
}
