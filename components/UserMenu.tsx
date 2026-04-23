"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const TIER_LABELS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  FREE: { label: "Free", color: "text-slate-600", bg: "bg-slate-100" },
  PRO: { label: "Pro", color: "text-blue-700", bg: "bg-blue-100" },
  ENTERPRISE: {
    label: "Enterprise",
    color: "text-violet-700",
    bg: "bg-violet-100",
  },
};

function Avatar({
  name,
  image,
}: {
  name?: string | null;
  image?: string | null;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "User"}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
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
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white ring-2 ring-white">
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
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />;
  }

  if (status === "unauthenticated" || !session) {
    return (
      <Link
        href="/auth/signin"
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
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
        className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-blue-200 transition-all"
        aria-label="User menu"
      >
        <Avatar name={user.name} image={user.image} />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 sm:w-64 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 animate-fade-in">
          {/* User info */}
          <div className="flex items-center gap-3 border-b border-slate-50 px-4 py-3.5">
            <Avatar name={user.name} image={user.image} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.name ?? "User"}
              </p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          {/* Subscription tier badge */}
          <div className="px-4 py-2.5 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Subscription</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tier.bg} ${tier.color}`}
              >
                {tier.label}
              </span>
            </div>
          </div>

          {/* Nav items */}
          <div className="p-1.5">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 7h18M3 12h18M3 17h18"
                />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Profile
            </Link>
            <Link
              href="/schedules"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Schedules
            </Link>
            <Link
              href="/compare"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 7h10M7 12h10M7 17h10M17 7l3 3-3 3M7 17l-3-3 3-3"
                />
              </svg>
              Compare
            </Link>
            {/* <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Audit
            </Link> */}

            {user.subscriptionTier === "FREE" && (
              <div className="mx-2 my-2 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3">
                <p className="text-xs font-semibold text-blue-800 mb-1">
                  Upgrade to Pro
                </p>
                <p className="text-xs text-blue-600 mb-2">
                  100 audits/day + priority processing
                </p>
                <button className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                  Upgrade →
                </button>
              </div>
            )}
          </div>

          {/* Sign out */}
          <div className="border-t border-slate-50 p-1.5">
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
