"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const TIER_LABELS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  FREE:       { label: "Free",       color: "text-slate-600",  bg: "bg-slate-100",  dot: "#94a3b8" },
  PRO:        { label: "Pro",        color: "text-blue-700",   bg: "bg-blue-50",    dot: "#3b82f6" },
  ENTERPRISE: { label: "Enterprise", color: "text-violet-700", bg: "bg-violet-50",  dot: "#8b5cf6" },
};

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 5a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1V5zM3 15a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1h-6a1 1 0 01-1-1v-4z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: "/schedules",
    label: "Schedules",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/compare",
    label: "Compare",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  // {
  //   href: "/settings/api-keys",
  //   label: "API Keys",
  //   icon: (
  //     <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
  //         d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  //     </svg>
  //   ),
  // },
];

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "User"}
        className="h-8 w-8 rounded-full object-cover"
        style={{ outline: '2px solid rgba(255,255,255,0.15)' }}
      />
    );
  }
  const initials = (name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
    >
      {initials}
    </div>
  );
}

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />;
  }

  if (status === "unauthenticated" || !session) {
    return (
      <Link
        href="/auth/signin"
        className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        Sign in
      </Link>
    );
  }

  const { user } = session;
  const tier = TIER_LABELS[user.subscriptionTier ?? "FREE"];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl p-1 transition-all hover:bg-white/10"
        aria-label="User menu"
      >
        <Avatar name={user.name} image={user.image} />
        <svg
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-60 rounded-2xl border bg-white shadow-2xl shadow-slate-200/80 animate-fade-down overflow-hidden"
          style={{ borderColor: '#e8edf5' }}
        >
          {/* User info header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ background: 'linear-gradient(135deg, #f8faff, #f1f5fe)' }}
          >
            <Avatar name={user.name} image={user.image} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name ?? "User"}</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tier.bg} ${tier.color}`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tier.dot }} />
              {tier.label}
            </span>
          </div>

          {/* Nav items */}
          <div className="p-1.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span className="text-slate-400">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Upgrade CTA (FREE tier) */}
          {user.subscriptionTier === "FREE" && (
            <div className="px-3 pb-2">
              <div
                className="rounded-xl border p-3"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))', borderColor: 'rgba(99,102,241,0.2)' }}
              >
                <p className="text-xs font-semibold text-indigo-900 mb-0.5">Upgrade to Pro</p>
                <p className="text-xs text-indigo-600 mb-2.5">100 audits/day + priority processing</p>
                <button
                  className="w-full rounded-lg py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  Upgrade →
                </button>
              </div>
            </div>
          )}

          {/* Sign out */}
          <div className="border-t p-1.5" style={{ borderColor: '#f1f5f9' }}>
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
