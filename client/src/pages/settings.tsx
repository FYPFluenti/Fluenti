import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Gamepad2,
  LineChart,
  Smile,
  SlidersHorizontal,
} from "lucide-react";

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: { email?: string } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const [, setLocation] = useLocation();

  // toggles (persist to your API in onChange)
  const [analyticsOn, setAnalyticsOn] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/80">Loading…</div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar (same as child-dashboard) */}
      <aside className="w-20 bg-background flex flex-col items-center py-6 space-y-6 fixed top-0 left-0 h-screen z-40 border-r border-border">
        <div className="w-6 h-6 rounded-full bg-orange-400" />
        {[
          { icon: Gamepad2, label: "Games", path: "/speech-therapy", id: "games" },
          { icon: LineChart, label: "Progress", path: "/progress-dashboard", id: "progress" },
          { icon: Smile, label: "Feedback", path: "/child-dashboard#feedback", id: "feedback" },
        ].map(({ icon: Icon, label, path, id }) => (
          <div key={id} className="relative group">
            <button
              onClick={() => setLocation(path)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition"
              aria-label={label}
            >
              <Icon className="w-6 h-6" />
            </button>
            <div className="pointer-events-none absolute left-[38px] bottom-0 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-3 transition bg-popover text-popover-foreground text-sm font-medium px-3 py-1 rounded-lg border border-border shadow">
              {label}
            </div>
          </div>
        ))}
      </aside>

      {/* Main */}
      <main className="ml-20 w-full">
        {/* Header actions (right) */}
        <header className="flex justify-end items-center gap-4 px-6 py-6">
          <button
            onClick={() => setLocation("/child-dashboard?prefs=1")}
            className="p-2 rounded-full hover:bg-muted transition"
            aria-label="Preferences"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </header>

        <div className="max-w-4xl mx-auto px-6 pb-24">
          {/* Profile header */}
          <section className="mb-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted grid place-items-center text-xl font-semibold">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-lg font-medium">{user?.email || "user@example.com"}</div>
            </div>
            <div className="mt-6 h-px bg-border" />
          </section>

          {/* Privacy settings */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-1">privacy settings</h2>
            <p className="text-muted-foreground mb-6">
              manage your cookie and tracking preferences
            </p>

            {/* Necessary cookies (locked) */}
            <div className="flex items-start gap-4 mb-5">
              <button
                disabled
                className="relative inline-flex h-6 w-12 cursor-not-allowed rounded-full bg-muted aria-checked:bg-primary transition"
                role="switch"
                aria-checked="true"
                aria-label="Necessary cookies (required)"
                title="Necessary cookies (required)"
              >
                <span className="pointer-events-none absolute top-1 left-1 inline-block h-4 w-4 rounded-full bg-foreground/60" />
              </button>
              <div>
                <div className="font-semibold">necessary cookies</div>
                <p className="text-sm text-muted-foreground max-w-prose">
                  required for the website to function properly. cannot be disabled.
                </p>
              </div>
            </div>

            {/* Analytics cookies (toggleable) */}
            <div className="flex items-start gap-4">
              <button
                onClick={() => setAnalyticsOn(v => !v)}
                className={`relative inline-flex h-6 w-12 rounded-full transition ${
                  analyticsOn ? "bg-foreground" : "bg-muted"
                }`}
                role="switch"
                aria-checked={analyticsOn ? "true" : "false"}
                aria-label={`Analytics cookies ${analyticsOn ? 'enabled' : 'disabled'}`}
                title={`Toggle analytics cookies ${analyticsOn ? 'off' : 'on'}`}
              >
                <span
                  className={`absolute top-1 inline-block h-4 w-4 rounded-full bg-background transition ${
                    analyticsOn ? "left-7" : "left-1"
                  }`}
                />
              </button>
              <div>
                <div className="font-semibold">analytics cookies</div>
                <p className="text-sm text-muted-foreground max-w-prose">
                  help us understand how visitors interact with our website using posthog analytics.
                </p>
              </div>
            </div>

            <div className="mt-8 h-px bg-border" />
          </section>

          {/* Usage analytics */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-1">usage analytics</h2>
            <p className="text-muted-foreground mb-4">how much you’ve used calmi</p>

            <div className="rounded-2xl border border-border bg-card text-card-foreground p-5">
              <div className="inline-flex items-center gap-2 bg-muted px-2.5 py-1 rounded-lg text-sm mb-4">
                free
              </div>

              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">text usage</span>
                <span className="font-medium">1%</span>
              </div>

              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-6">
                <div className="h-full w-[1%] bg-[#F5B82E]" />
              </div>

              <button
                className="inline-flex items-center justify-center rounded-xl bg-[#F5B82E] text-black font-semibold px-4 py-2 hover:opacity-90 transition"
                onClick={() => setLocation("/pricing")}
              >
                upgrade
              </button>
            </div>

            <div className="mt-8 h-px bg-border" />
          </section>

          {/* Danger zone */}
          <section className="mb-6">
            <h2 className="text-2xl font-bold mb-1">danger zone</h2>
            <p className="text-muted-foreground mb-6">
              be careful with these settings
            </p>

            <div className="space-y-6">
              <div>
                <button
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted transition"
                  onClick={() => {
                    // TODO: call your API to reset chat history
                  }}
                >
                  reset chat history
                </button>
                <p className="text-sm text-muted-foreground mt-2 max-w-prose">
                  this will reset all of your previous conversations and you start from a clean slate.
                  calmi will not remember what you’ve talked about earlier.
                </p>
              </div>

              <div>
                <button
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
                  onClick={() => {
                    // TODO: call your API to delete account
                  }}
                >
                  delete account
                </button>
                <p className="text-sm text-muted-foreground mt-2 max-w-prose">
                  this will delete your account and everything related to it. be careful, it cannot be undone.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
