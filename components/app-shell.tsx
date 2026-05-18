import Link from "next/link";
import { Bell, Braces, Car, DatabaseZap, Eye, LayoutDashboard, Radar, ShieldCheck, Phone } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/security/clerk-config";

const nav = [
  { href: "/", label: "Exposure Search", icon: Radar },
  { href: "/vehicle-info", label: "Vehicle Info", icon: Car },
  { href: "/phone-intel", label: "Phone Intel", icon: Phone },
  { href: "/dashboard", label: "HIBP Breach Intel", icon: LayoutDashboard },
  { href: "/results/demo", label: "Watchlist", icon: Eye },
  { href: "/docs", label: "API Docs", icon: Braces },
  { href: "/admin", label: "Admin", icon: ShieldCheck }
];


export async function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-10 soft-grid opacity-50" />
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 border-r border-white/10 bg-[#07111c]/90 px-4 py-5 backdrop-blur-xl lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md border border-accent-300/20 bg-accent-500/15 text-accent-100 shadow-glow">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-wide text-white">GeoTrace AI</span>
            <span className="block text-xs text-slate-400">Exposure Intelligence</span>
          </span>
        </Link>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
            >
              <item.icon className="h-4 w-4 text-accent-200" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 rounded-lg border border-accent-300/20 bg-accent-400/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-accent-100">
            <DatabaseZap className="h-4 w-4" />
            Public-source mode
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Breach metadata only. No leaked passwords, stolen credentials, private databases, or dark-web scraping.
          </p>
        </div>
      </aside>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-bg/80 backdrop-blur-xl lg:pl-72">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent-300/20 bg-accent-500/15 text-accent-100 shadow-glow">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-wide text-white">GeoTrace AI</span>
              <span className="hidden text-xs text-slate-400 sm:block">Premium breach monitoring</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="hidden sm:inline-flex">
              <Bell className="h-4 w-4" />
              Alert Center
            </Button>
            {isClerkConfigured ? (
              <>
                <Show when="signed-out">
                  <Link
                    href="/sign-in"
                    className="hidden rounded-md border border-accent-300/30 bg-accent-500/15 px-3 py-2 text-sm font-medium text-accent-100 transition hover:bg-accent-500/25 sm:inline-flex"
                  >
                    Sign in
                  </Link>
                </Show>
                <Show when="signed-in">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9 ring-2 ring-accent-300/40"
                      }
                    }}
                  />
                </Show>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <div className="lg:pl-72">{children}</div>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-bg/90 px-2 py-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
          {nav.slice(0, 6).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-md px-1.5 py-2 text-[10px] text-slate-300 transition hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate w-full text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
