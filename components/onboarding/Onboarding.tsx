'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const GOALS = [
  { id: 'seo', label: 'Improve SEO rankings', icon: '🔍' },
  { id: 'performance', label: 'Speed up my site', icon: '⚡' },
  { id: 'security', label: 'Fix security issues', icon: '🔒' },
  { id: 'client', label: 'Audit clients\' sites', icon: '👥' },
  { id: 'competitor', label: 'Monitor competitors', icon: '📊' },
  { id: 'all', label: 'All of the above', icon: '🚀' },
];

const ROLES = [
  { id: 'developer', label: 'Developer' },
  { id: 'seo', label: 'SEO Specialist' },
  { id: 'marketer', label: 'Marketer' },
  { id: 'agency', label: 'Agency Owner' },
  { id: 'business', label: 'Business Owner' },
  { id: 'other', label: 'Other' },
];

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const name = session?.user?.name ?? 'there';
  const firstName = name.split(' ')[0];

  function toggleGoal(id: string) {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  async function finish() {
    setLoading(true);
    try {
      await fetch('/api/user/onboarding', { method: 'POST' });
      await update({ onboardingDone: true });
      router.push('/');
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center animate-fade-in">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-200">
        <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">
        Welcome, {firstName}! 👋
      </h1>
      <p className="text-slate-500 leading-relaxed max-w-sm mx-auto mb-8">
        You&apos;re all set. SiteAudit will give you instant, AI-powered reports on any website&apos;s SEO, performance, and security.
      </p>
      <button
        onClick={() => setStep(1)}
        className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all"
      >
        Let&apos;s get started
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
        </svg>
      </button>
    </div>,

    // Step 1: Role
    <div key="role" className="animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-900 mb-1">What best describes you?</h2>
      <p className="text-slate-500 text-sm mb-6">We&apos;ll tailor audit insights to your role</p>
      <div className="grid grid-cols-2 gap-2 mb-8">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRole(r.id)}
            className={`rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all ${
              selectedRole === r.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={() => setStep(0)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Back
        </button>
        <button
          onClick={() => setStep(2)}
          disabled={!selectedRole}
          className="flex-[2] rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>,

    // Step 2: Goals
    <div key="goals" className="animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-900 mb-1">What are your main goals?</h2>
      <p className="text-slate-500 text-sm mb-6">Select all that apply</p>
      <div className="grid grid-cols-1 gap-2 mb-8">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => toggleGoal(g.id)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all ${
              selectedGoals.includes(g.id)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">{g.icon}</span>
            {g.label}
            {selectedGoals.includes(g.id) && (
              <svg className="ml-auto h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Back
        </button>
        <button
          onClick={finish}
          disabled={loading || selectedGoals.length === 0}
          className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : null}
          {loading ? 'Setting up…' : 'Start auditing →'}
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-blue-600' : i < step ? 'w-2 bg-blue-300' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {steps[step]}
      </div>
    </div>
  );
}
